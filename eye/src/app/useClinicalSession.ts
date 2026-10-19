import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export function useClinicalSession() {
  const [currentUser, setCurrentUser] = useState(null);
  const [aiStatus, setAiStatus] = useState("Checking backend...");
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    api
      .getCurrentUser()
      .then((user) => {
        if (isCurrent) setCurrentUser(user);
      })
      .catch((error) => {
        console.error("Could not restore the clinician session:", error);
        if (isCurrent) {
          api.clearSession();
          setCurrentUser(null);
        }
      });

    const handleExpiredSession = () => {
      setCurrentUser(null);
      setIsAuthDialogOpen(true);
    };

    window.addEventListener("retinasight:auth-expired", handleExpiredSession);

    return () => {
      isCurrent = false;
      window.removeEventListener("retinasight:auth-expired", handleExpiredSession);
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    api.checkHealth().then((health) => {
      if (!isCurrent) return;
      if (!health) {
        setAiStatus("Backend unavailable");
      } else if (!health.model?.loaded) {
        setAiStatus("Model unavailable");
      } else if (health.status !== "healthy") {
        setAiStatus("Service degraded");
      } else {
        setAiStatus("Ready");
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleSignIn = async (email, password) => {
    const user = await api.login(email, password);
    setCurrentUser(user);
    setIsAuthDialogOpen(false);
  };

  const handleSignOut = () => {
    api.clearSession();
    setCurrentUser(null);
    setPendingUploadFile(null);
  };

  return {
    currentUser,
    aiStatus,
    isAuthDialogOpen,
    pendingUploadFile,
    setIsAuthDialogOpen,
    setPendingUploadFile,
    handleSignIn,
    handleSignOut,
    setCurrentUser,
    setAiStatus,
  };
}
