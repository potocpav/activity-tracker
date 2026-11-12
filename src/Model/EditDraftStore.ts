import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EditDraft } from "./EditDraft";

type EditDraftState = {
  draft: EditDraft | null;
  setDraft: (draft: EditDraft) => void;
  /** Drop the draft, but only if it belongs to the given key */
  clearDraft: (key: string) => void;
};

/**
 * The single unsaved Edit Data Point draft. Persisted under its own key, apart from the
 * main store, so that saving it on every keystroke does not reserialize all activities.
 */
const useEditDraftStore = create<EditDraftState>()(
  persist(
    (set, get) => ({
      draft: null,
      setDraft: (draft: EditDraft) => set({ draft }),
      clearDraft: (key: string) => {
        if (get().draft?.key === key) {
          set({ draft: null });
        }
      },
    }),
    {
      name: "editDataPointDraft",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ draft: state.draft }),
    },
  ),
);

export default useEditDraftStore;
