import { createContext, useContext, useState } from "react";
import GlobalModal from "../components/GlobalModal";

const ModalContext = createContext();

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({
    visible: false,
    type: "alert",
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (message) => {
    return new Promise((resolve) => {
      setModal({
        visible: true,
        type: "alert",
        message,
        onConfirm: () => {
          setModal((prev) => ({ ...prev, visible: false }));
          resolve(true);
        },
        onCancel: null,
      });
    });
  };

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setModal({
        visible: true,
        type: "confirm",
        message,
        onConfirm: () => {
          setModal((prev) => ({ ...prev, visible: false }));
          resolve(true);
        },
        onCancel: () => {
          setModal((prev) => ({ ...prev, visible: false }));
          resolve(false);
        },
      });
    });
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <GlobalModal
        visible={modal.visible}
        type={modal.type}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </ModalContext.Provider>
  );
}
