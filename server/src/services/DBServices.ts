import { Model, Document } from 'mongoose';

const createDocument = async <T extends Document>(model: Model<T>, data: Partial<T>) => {
    return await model.create(data);
};

const getDocuments = async <T extends Document>(model: Model<T>, query = {}) => {
    return await model.find(query);
};

const getDocumentById = async <T extends Document>(model: Model<T>, id: string) => {
    return await model.findById(id);
};

const updateDocument = async <T extends Document>(model: Model<T>, id: string, data: Partial<T>) => {
    return await model.findByIdAndUpdate(id, data, { new: true });
};

const updateDocumentById = async <T extends Document>(
    model: Model<T>,
    id: string,
    data: Partial<T>,
): Promise<T | null> => {
    return await model.findByIdAndUpdate(id, data, { new: true });
};

const deleteDocument = async <T extends Document>(model: Model<T>, id: string) => {
    return await model.findByIdAndDelete(id);
};

const getDocumentByQuery = async <T extends Document>(model: Model<T>, query: any) => {
    return await model.findOne(query).exec();
};

export {
    createDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    updateDocumentById,
    deleteDocument,
    getDocumentByQuery,
};
