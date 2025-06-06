import { createContext, useContext, useState, ReactNode } from "react";

interface DialogContextType {
  addFamilyOpen: boolean;
  setAddFamilyOpen: (open: boolean) => void;
  addStudentOpen: boolean;
  setAddStudentOpen: (open: boolean) => void;
  addCourseOpen: boolean;
  setAddCourseOpen: (open: boolean) => void;
  addClassOpen: boolean;
  setAddClassOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);

  return (
    <DialogContext.Provider value={{
      addFamilyOpen,
      setAddFamilyOpen,
      addStudentOpen,
      setAddStudentOpen,
      addCourseOpen,
      setAddCourseOpen,
      addClassOpen,
      setAddClassOpen,
    }}>
      {children}
    </DialogContext.Provider>
  );
}

export function useDialogs() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialogs must be used within a DialogProvider");
  }
  return context;
}