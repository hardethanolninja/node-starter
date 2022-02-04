class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1) filtering
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString };
    const ignoredFields = ['page', 'sort', 'limit', 'fields'];
    ignoredFields.forEach((el) => delete queryObj[el]);

    // 2) advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    //3) sorting
    if (this.queryString.sort) {
      //for multiple search parameters
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      //shows newest first by default
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  limitFields() {
    //4) field limiting
    if (this.queryString.fields) {
      const queryFields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(queryFields);
    } else {
      //minus excludes selection
      //v is internal mongoose field
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    //5) pagination
    //define default values
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
