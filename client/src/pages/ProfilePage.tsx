import { useEffect, useMemo, useState } from "react";
import { useUserStore } from "../store/useUserStore";
import { Camera, Mail, User } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { useParams } from "react-router-dom";

interface PublicUser {
  _id: string;
  fullName: string;
  profilePic: string;
  email: string;
  createdAt: string;
  isOnline?: boolean;
}

const ProfilePage = () => {
  const { userId } = useParams();
  const id = userId;
  const { authUser } = useAuthStore();
  const { getPublicUser, updateProfile, isUpdatingProfile } = useUserStore();
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isViewingOther = Boolean(id && id !== authUser?._id);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!id) {
        setPublicUser(authUser || null);
        return;
      }
      if (isViewingOther) {
        setIsLoading(true);
        const u = await getPublicUser(id);
        if (alive) {
          setPublicUser(u);
          setIsLoading(false);
        }
      } else {
        setPublicUser(authUser || null);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [id, isViewingOther, authUser?._id]);

  const displayUser = useMemo(
    () => (isViewingOther ? publicUser : authUser),
    [isViewingOther, publicUser, authUser]
  );

  if (isViewingOther && (isLoading || !displayUser)) {
    return (
      <div className="h-screen pt-20 flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!displayUser) return null;

  console.log(
    "paramId:",
    id,
    "authId:",
    authUser?._id,
    "isViewingOther:",
    isViewingOther
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewingOther) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Img = reader.result as string;
      setSelectedImg(base64Img);
      await updateProfile({ profilePic: base64Img });
    };
  };

  const avatarSrc =
    !isViewingOther && selectedImg
      ? selectedImg
      : displayUser.profilePic ||
        "https://res.cloudinary.com/dw9bbrnke/image/upload/v1750328296/453178253_471506465671661_2781666950760530985_n_k3uj5r.png";

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">
              {isViewingOther
                ? "Public profile information"
                : "Your profile information"}
            </p>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={avatarSrc}
                loading="lazy"
                alt="Avatar"
                className="size-32 rounded-full object-cover border-4"
              />
              {!isViewingOther && (
                <label
                  htmlFor="avatar-upload"
                  className={`
                    absolute bottom-0 right-0 
                    bg-base-content hover:scale-105
                    p-2 rounded-full cursor-pointer 
                    transition-all duration-200
                    ${
                      isUpdatingProfile
                        ? "animate-pulse pointer-events-none"
                        : ""
                    }
                  `}
                >
                  <Camera className="w-5 h-5 text-base-200" />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUpdatingProfile}
                  />
                </label>
              )}
            </div>
            {!isViewingOther && (
              <p className="text-sm text-zinc-400">
                {isUpdatingProfile
                  ? "Updating..."
                  : "Click the camera icon to update your photo"}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Fullname
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {displayUser?.fullName}
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {displayUser?.email}
              </p>
            </div>
          </div>
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{displayUser?.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
