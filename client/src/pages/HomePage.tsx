import { useNavigate, useParams } from "react-router-dom";
import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import Sidebar from "../components/Sidebar";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";

const HomePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { selectedUser, setSelectedUser, users, hasInitializedChat } =
    useChatStore();

  useEffect(() => {
    if (userId && users.length > 0 && !hasInitializedChat) {
      const user = users.find((u) => u._id === userId);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [userId, users, hasInitializedChat, setSelectedUser]);

  useEffect(() => {
    if (selectedUser && hasInitializedChat) {
      navigate(`/chat/${selectedUser._id}`, { replace: true });
    }
  }, [selectedUser, hasInitializedChat, navigate]);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />

            {selectedUser ? <ChatContainer /> : <NoChatSelected />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
