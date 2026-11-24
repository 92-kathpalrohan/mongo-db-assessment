import { Injectable } from '@nestjs/common';
import { Model, mongo, PipelineStage, QueryFilter } from 'mongoose';

// Generic MongoDB operations. Repositories call these instead of the model,
// so cross-cutting concerns (error handling, logging) have one home.
// Knows nothing about specific entities: mapping stays in each repository.
@Injectable()
export class MongoService {
    async create<T>({ model, document }: { model: Model<T>; document: T }) {
        const created = await model.create(document);
        return created.toObject();
    }

    async findOne<T>({
        model,
        filter,
    }: {
        model: Model<T>;
        filter: QueryFilter<T>;
    }) {
        return model.findOne(filter).lean();
    }

    async aggregate<R>({
        model,
        pipeline,
        collation,
    }: {
        model: Model<any>;
        pipeline: PipelineStage[];
        collation?: mongo.CollationOptions;
    }): Promise<R[]> {
        const aggregation = model.aggregate<R>(pipeline);
        if (collation) {
            aggregation.collation(collation);
        }
        return aggregation.exec();
    }
}
