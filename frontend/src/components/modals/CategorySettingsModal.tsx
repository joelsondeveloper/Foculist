import Modal from "react-modal";
import { ICategory, ICategoryClient } from "@/models/Category";
import { customStyles } from "@/app/utils/customStylesModal";
import CategoryFormModal from "./CategoryFormModal";

if (typeof window !== "undefined") {
  Modal.setAppElement("#root");
}

interface CategorySettingsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  category: ICategoryClient | null;
  onEdit: (category: ICategoryClient) => void;
  onDelete: (id: string) => void;
}

const CategorySettingsModal = ({
  isOpen,
  onRequestClose,
  category,
  onEdit,
  onDelete,
}: CategorySettingsModalProps) => {
  if (!category) {
    return null;
  }

  const handleEdit = () => {
    if (category) {
      onEdit(category);
      onRequestClose();
    }
  };

  const handleDelete = () => {
    if (category) {
      onDelete(String(category._id));
      onRequestClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      contentLabel="Category Settings Modal"
    >
      <div className="flex flex-col gap-4 min-w-[200px]">
        <h2 className="text-xl font-bold text-center mb-2">
          Opções de {category.title}
        </h2>
        <button
          onClick={handleEdit}
          className="w-full text-left p-3 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Editar Categoria
        </button>
        <button
          onClick={handleDelete}
          className="w-full text-left p-3 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
        >
          Apagar Categoria
        </button>
      </div>
    </Modal>
  );
};

export default CategorySettingsModal;
