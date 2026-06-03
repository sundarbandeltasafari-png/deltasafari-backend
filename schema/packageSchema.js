import Joi from "joi";

export const tourValidationSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(''), // Optional string
    sort_order: Joi.number().integer().default(1), // Fallback to 1 if missing
    meta_title: Joi.string().allow(''),
    meta_description: Joi.string().allow(''),
    tags: Joi.string().allow(''),
    to_destination: Joi.string().required(),
    from_destination: Joi.string().required(),
    duration_days: Joi.number().integer().required(),
    duration_nights: Joi.number().integer().required(),
    base_price: Joi.number().positive().required(),
    discount: Joi.number().min(0).default(0),
    actual_price: Joi.number().positive().required(),
    category: Joi.string().required()
});