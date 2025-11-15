import mongoose, { Schema, Document, Types } from "mongoose";
import Task from "./Task";

export interface ICategory extends Document {
  title: string;
  color: string;
  userId: Types.ObjectId;
  order: number;
  automationRule?: {
    rules: Array<{
      field:
        | "title"
        | "description"
        | "status"
        | "dueDate"
        | "priority"
        | "isCompleted";
      operator:
        | "equals"
        | "notEquals"
        | "contains"
        | "notContains"
        | "lessThan"
        | "greaterThan"
        | "between"
        | "isTrue"
        | "isFalse"
        | "isNull"
        | "isNotNull"
        | "isPast"
        | "isFuture"
        | "isToday"
        | "isTomorrow";
      value?: any;
      value2?: any;
    }>;
    logicalOperator?: "AND" | "OR";
  } | null;
}

export interface ICategoryClient {
  _id: string;
  title: string;
  color: string;
  order: number;
  userId: string;
  automationRule?: {
    rules: Array<{
      field:
        | "title"
        | "description"
        | "status"
        | "dueDate"
        | "priority"
        | "isCompleted";
      operator:
        | "equals"
        | "notEquals"
        | "contains"
        | "notContains"
        | "lessThan"
        | "greaterThan"
        | "between"
        | "isTrue"
        | "isFalse"
        | "isNull"
        | "isNotNull"
        | "isPast"
        | "isFuture"
        | "isToday"
        | "isTomorrow";
      value?: any;
      value2?: any;
    }>;
    logicalOperator?: "AND" | "OR";
  };
}

export type CategoryCreateDTO = {
  title: string;
  color: string;
  userId: Types.ObjectId | string;
  order?: number;
  automationRule?: {
    rules: Array<{
      field:
        | "title"
        | "description"
        | "status"
        | "dueDate"
        | "priority"
        | "isCompleted";
      operator:
        | "equals"
        | "notEquals"
        | "contains"
        | "notContains"
        | "lessThan"
        | "greaterThan"
        | "between"
        | "isTrue"
        | "isFalse"
        | "isNull"
        | "isNotNull"
        | "isPast"
        | "isFuture"
        | "isToday"
        | "isTomorrow";
      value?: any;
      value2?: any;
    }>;
    logicalOperator?: "AND" | "OR";
  } | null;
};

const CategorySchema = new Schema<ICategory>(
  {
    title: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
      default: "#888",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
      required: true,
    },
    automationRule: {
      type: Object,
      default: null,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.pre("deleteOne", { document: true, query: true }, async function (next) {
  const category = this as ICategory;
  console.log(`🟡 Executando middleware pre-deleteOne para Category ${category._id}`);

  try {
    
    await Task.deleteMany({ status: String(category._id) });

    next();

  } catch (error) {
    console.error("Erro ao deletar tarefas relacionadas à categoria:", error);
    next(new Error("Erro ao deletar tarefas relacionadas à categoria"));
  }
});

export default mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
