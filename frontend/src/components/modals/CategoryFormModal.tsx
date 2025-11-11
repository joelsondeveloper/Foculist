"use client";

import { useState, useEffect } from "react";
import Modal from "react-modal";
import { ICategory, ICategoryClient } from "@/models/Category";
import { customStyles } from "@/app/utils/customStylesModal";

interface CategoryFormData {
  title: string;
  color: string;
  id?: string;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  categoryToEdit: ICategoryClient | null;
  onSave: (data: CategoryFormData) => void;
  loading: boolean;
}

const CategoryFormModal = ({ isOpen, onRequestClose, categoryToEdit, onSave, loading }: CategoryFormModalProps) => {

  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#888");

  useEffect(() => {
  if (isOpen) {
      setTitle(categoryToEdit?.title || "");
      setColor(categoryToEdit?.color || "#888888");
    }
}, [isOpen, categoryToEdit]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({ title, color, ...(categoryToEdit?._id ? { id: String(categoryToEdit._id) } : {}), });
    onRequestClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
       <form onSubmit={handleSubmit} className="flex flex-col gap-6 min-w-[300px]">
        <h2 className="text-xl font-bold text-center">
          {categoryToEdit ? 'Editar Categoria' : 'Criar Nova Categoria'}
        </h2>
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Título</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1A1A2E] text-white rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="color" className="block text-sm font-medium mb-1">Cor</label>
          <input
            id="color"
            type="color" // O input do tipo 'color' abre um seletor de cores!
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded-lg"
          />
        </div>
        <div className="flex gap-4 mt-4">
          <button type="button" onClick={onRequestClose} className="flex-1 bg-gray-600 hover:bg-gray-700 p-2 rounded-lg">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 bg-green-500 hover:bg-green-600 p-2 rounded-lg disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CategoryFormModal
