const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getAllCategorysModel, createCategoryModel, setCategoryModel, deleteCategoryModel, getAllCategorysConditionModel, getParticularCategorysModel } = require('../../../model/admin/service/adminCategoryModel');
var slugify = require('slugify');
const { deleteFile } = require('../../../helper/deleteHelper');

const categoryChild = async (id = '') => {
    try {
        var category = await getAllCategorysConditionModel({ parent_id: id, status: 1 });
        return Promise.all(
            category.map(async (cat) => {
                const children = await categoryChild(cat?.id);
                return {
                    ...cat,
                    children: children
                }
            })
        )
    } catch (error) {
        return []
    }
}

const getAllCategory = asyncHandler(async (req, res) => {
    try {
        const category = await categoryChild();
        return res.status(200).json({ status: true, msg: 'All category..', category: category })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getCategory = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.condition) {
            return res.status(400).json({ status: false, msg: 'Please enter valid category.' })
        }
        const category = await getAllCategorysConditionModel(req?.body?.condition);
        return res.status(200).json({ status: true, msg: 'Category..', category: category })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getParticularCategory = asyncHandler(async (req, res) => {
    try {
        const categoryId = req?.query?.id;
        if (!categoryId) {
            return res.status(400).json({ status: false, msg: 'Please enter valid category.' })
        }
        const category = await getParticularCategorysModel({ id: categoryId });
        return res.status(200).json({ status: true, msg: 'Category..', category: category })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const createCategory = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.name && !req?.body?.description && !req?.body?.sort_order) {
            return res.status(400).json({ status: false, msg: 'Please enter valid category details.' })
        }
        const categoryData = {
            name: req?.body?.name,
            description: req?.body?.description,
            sort_order: req?.body?.sort_order,
            parent_id: req?.body?.parent_id ? req?.body?.parent_id : null,
            showleft: req?.body?.showleft ? 1 : 0,
            slug: slugify(req?.body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }),
            image: null
        }
        if (req.file) {
            categoryData.image = req.file.path;
        }
        const category = await createCategoryModel(categoryData);
        return res.status(200).json({ status: true, msg: 'Category created successfully..', category: category })
    } catch (error) {
        console.log(error);
        
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const setCategory = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.name && !req?.body?.description && !req?.body?.sort_order) {
            return res.status(400).json({ status: false, msg: 'Please enter valid category details.' })
        }
        const particularCategory = await getParticularCategorysModel(req?.body?.id);
        if (!particularCategory && particularCategory.length == 0) {
            return res.status(400).json({ status: false, msg: 'No category found!' })
        }
        const categoryData = {
            name: req?.body?.name,
            description: req?.body?.description,
            sort_order: req?.body?.sort_order,
            showleft: req?.body?.showleft ? 1 : 0,
            slug: slugify(req?.body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true })
        }
        if (req.file) {
            categoryData.image = req.file.path;
            if (particularCategory[0]?.image) {
                await deleteFile(particularCategory[0]?.image);
            }
        }
        if (req?.body?.parent_id && req?.body?.parent_id != 'null') {
            zoneData.parent_id = req?.body?.parent_id
        }
        const category = await setCategoryModel(categoryData, req?.body?.id);
        return res.status(200).json({ status: true, msg: 'Category update successfully.', category: category })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const deleteCategory = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid language.' })
        }
        const particularCategory = await getParticularCategorysModel(req?.body?.id);
        if (particularCategory[0]?.image) {
            await deleteFile(particularCategory[0]?.image);
        }
        const category = await deleteCategoryModel(req?.body?.id);
        return res.status(200).json({ status: true, msg: 'Category update successfully.', category: category })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})




module.exports = {
    getAllCategory,
    createCategory,
    getParticularCategory,
    createCategory,
    setCategory,
    deleteCategory
}

