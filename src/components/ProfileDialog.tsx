import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Upload, Shield } from "lucide-react";

interface ProfileDialogProps {
  children: React.ReactNode;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  two_factor_enabled: boolean;
}

export const ProfileDialog = ({ children }: ProfileDialogProps) => {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const { user, session } = useAuth();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setTwoFactorEnabled(data.two_factor_enabled || false);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchProfile();
    }
  }, [open, user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (!user) return;

    try {
      if (enabled) {
        // Enable 2FA
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'WAFA Preschool',
          friendlyName: 'WAFA Preschool 2FA'
        });

        if (error) {
          toast.error('Failed to enable 2FA: ' + error.message);
          return;
        }

        if (data) {
          toast.success('2FA enabled successfully! Please scan the QR code with your authenticator app.');
          setTwoFactorEnabled(true);
        }
      } else {
        // For disabling 2FA, we would need to get the factor ID first
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (factors && factors.totp && factors.totp.length > 0) {
          const { error } = await supabase.auth.mfa.unenroll({
            factorId: factors.totp[0].id
          });

          if (error) {
            toast.error('Failed to disable 2FA: ' + error.message);
            return;
          }

          toast.success('2FA disabled successfully');
          setTwoFactorEnabled(false);
        }
      }

      // Update profile in database
      await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          two_factor_enabled: enabled
        });

    } catch (error) {
      console.error('Error toggling 2FA:', error);
      toast.error('Failed to update 2FA settings');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);
    try {
      let avatarUrl = profile?.avatar_url;

      // Upload avatar if selected
      if (avatarFile) {
        avatarUrl = await handleAvatarUpload(avatarFile);
        if (!avatarUrl) {
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          two_factor_enabled: twoFactorEnabled
        });

      if (error) {
        toast.error("Failed to update profile: " + error.message);
      } else {
        toast.success("Profile updated successfully");
        setOpen(false);
        setAvatarFile(null);
        fetchProfile();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("An error occurred while updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Update your profile information and security settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar Section */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url || undefined} 
                />
                <AvatarFallback>
                  {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                    }
                  }}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Two-Factor Authentication */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Two-Factor Authentication
                </Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleToggle2FA}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};