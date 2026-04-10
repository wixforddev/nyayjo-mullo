import mongoose from 'mongoose';

interface PaginateOptions {
  sortBy?: string;
  limit?: number | string;
  page?: number | string;
  populate?: string;
}

interface PaginateResult<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

const paginate = (schema: mongoose.Schema) => {
  schema.statics.paginate = async function (
    filter: any,
    options: PaginateOptions
  ): Promise<PaginateResult<any>> {
    let sort = '';
    if (options.sortBy) {
      const sortingCriteria: string[] = [];
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        sortingCriteria.push((order === 'desc' ? '-' : '') + key);
      });
      sort = sortingCriteria.join(' ');
    } else {
      sort = 'createdAt';
    }

    const limit =
      options.limit && parseInt(options.limit as string, 10) > 0
        ? parseInt(options.limit as string, 10)
        : 10;
    const page =
      options.page && parseInt(options.page as string, 10) > 0
        ? parseInt(options.page as string, 10)
        : 1;
    const skip = (page - 1) * limit;

    const countPromise = this.countDocuments(filter).exec();
    let docsPromise = this.find(filter).sort(sort).skip(skip).limit(limit);

    if (options.populate) {
      options.populate.split(',').forEach((populateOption) => {
        const [field, ...fieldsToPopulate] = populateOption.split(' ');
        let populateFields = '';
        if (fieldsToPopulate.length > 0) {
          populateFields = fieldsToPopulate.join(' ');
        }
        docsPromise = docsPromise.populate({
          path: field,
          select: populateFields,
        });
      });
    }

    docsPromise = docsPromise.exec();

    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalResults, results] = values;
      const totalPages = Math.ceil(totalResults / limit);
      const result: PaginateResult<any> = {
        results,
        page,
        limit,
        totalPages,
        totalResults,
      };
      return Promise.resolve(result);
    });
  };
};

export default paginate;
export { PaginateOptions, PaginateResult };
