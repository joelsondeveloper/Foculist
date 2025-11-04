"use client";

import {useState, useEffect} from "react";
import Modal from "react-modal";
import { ICategory } from "@/models/Category";
import { ITask } from "@/models/Task";
import { customStyles } from "@/app/utils/customStylesModal";

if (typeof window !== "undefined") {
    Modal.setAppElement("#root");
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  task: ITask | null;
  categories: ICategory[];
  onSave: (taskData: Partial<ITask> & { id: string }) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const TaskDetailModal = ({ isOpen, onRequestClose, task, categories, onSave, onDelete }: TaskDetailModalProps) => {

    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
            setSelectedCategory(task.status);
            setIsEditing(false);
        }
    }, [task, isOpen]);

    if (!task) {
        return null;
    }

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setTitle(task.title);
        setDescription(task.description || "");
        setSelectedCategory(task.status);
    };

    const handleDeleteClick = async () => {
        setLoading(true);
        await onDelete(String(task._id));
        setLoading(false);
        onRequestClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave({ id: String(task._id), title, description, status: selectedCategory });
        setLoading(false);
        setIsEditing(false);
        // onRequestClose();
    };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 min-w-[400px] max-w-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Editar Tarefa' : 'Detalhes da Tarefa'}
          </h2>
          {/* Mostra o botão de fechar */}
          <button type="button" onClick={onRequestClose} className="text-2xl">&times;</button>
        </div>
        
        {/* CAMPOS DO FORMULÁRIO */}
        <div>
          <label htmlFor="taskTitle" className="block text-sm font-medium mb-1">Título</label>
          <input
            id="taskTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            // O campo fica desabilitado se NÃO estiver no modo de edição
            disabled={!isEditing}
            className="w-full bg-[#1A1A2E] rounded-lg px-3 py-2 disabled:opacity-70"
            required
          />
        </div>

        <div>
          <label htmlFor="taskDescription" className="block text-sm font-medium mb-1">Descrição</label>
          <textarea
            id="taskDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isEditing}
            rows={4}
            className="w-full bg-[#1A1A2E] rounded-lg px-3 py-2 disabled:opacity-70"
          />
        </div>

        <div>
          <label htmlFor="taskCategory" className="block text-sm font-medium mb-1">Categoria</label>
          <select
            id="taskCategory"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={!isEditing}
            className="w-full bg-[#1A1A2E] rounded-lg px-3 py-2 disabled:opacity-70"
          >
            {categories.map((cat) => (
              <option key={String(cat._id)} value={String(cat._id)}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>
        
        {/* BOTÕES DE AÇÃO - Renderização Condicional */}
        <div className="flex gap-4 mt-4">
          {isEditing ? (
            // Botões do modo de EDIÇÃO
            <>
              <button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-600 hover:bg-gray-700 p-2 rounded-lg">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="flex-1 bg-green-500 hover:bg-green-600 p-2 rounded-lg disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </>
          ) : (
            // Botões do modo de VISUALIZAÇÃO
            <>
              <button type="button" onClick={handleDeleteClick} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 p-2 rounded-lg disabled:opacity-50">
                {loading ? 'Deletando...' : 'Deletar'}
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); 
              e.stopPropagation();
              handleEditClick(); }}
             className="flex-1 bg-blue-500 hover:bg-blue-600 p-2 rounded-lg">
                Editar
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default TaskDetailModal
