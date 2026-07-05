const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getAllPagesConditionModel, getParticularPagesConditionModel, getAllFaqConditionModel, getAllBlogsConditionModel, getSearchPostsLatestModel, getTotalCategoryBlogsModel, getTrendingBlogsModel, getParticularBlogsConditionModel } = require('../../model/service/pageModel');
const { urlDecode } = require('../../helper/urlHelper');

const getAllPages = asyncHandler(async (req, res, next) => {
    try {
        const Pages = await getAllPagesConditionModel({ status: 1 });
        return res.status(200).json({ status: true, msg: 'Pages found!', pages: Pages })
    } catch (error) {
        next(error)
    }
})

const getParticularPage = asyncHandler(async (req, res, next) => {
    try {
        const pageParam = req.query?.page;
        if (!pageParam) {
            return res.status(400).json({ status: false, msg: 'No Page name found.' })
        }
        const Page = await getParticularPagesConditionModel({ 'page_master.status': 1, 'page_master.slug': pageParam });
        // console.log(Page)
        return res.status(200).json({ status: true, msg: 'Particular Page found!', page: Page })
    } catch (error) {
        next(error)
    }
})

const getFaqPage = asyncHandler(async (req, res, next) => {
    try {
        const pageParam = req.query?.page;
        if (!pageParam) {
            return res.status(400).json({ status: false, msg: 'No Page name found.' })
        }
        const Page = await getAllFaqConditionModel({ 'page_master.slug': pageParam });
        // console.log(Page)
        return res.status(200).json({ status: true, msg: 'Particular Page found!', page: Page })
    } catch (error) {
        next(error)
    }
})


const getAllBlogs = asyncHandler(async (req, res, next) => {
    try {
        const lang = req.cookies['lang'] || req?.query?.lang;
        const lastId = req?.query?.id;
        const cat = req?.query?.cat;
        const blogs = await getAllBlogsConditionModel(lastId ? (cat ? {'categories.slug': cat, 'posts.status': 1, 'posts.id <': lastId } : { 'posts.status': 1, 'posts.id <': lastId }) : (cat ? { 'posts.status': 1, 'categories.slug': cat} : { 'posts.status': 1 }));
        if (blogs.length == 0) {
            return res.status(200).json({ status: true, msg: 'No Post Found!', blogs: [] })
        }
        return res.status(200).json({ status: true, msg: 'All blogs', blogs: blogs })
    } catch (error) {
        next(error)
    }
})

const getParticularBlog = asyncHandler(async (req, res, next) => {
    try {
        const blogId = urlDecode(req.query?.id);
        if (!blogId) {
            return res.status(200).json({ status: false, msg: 'No blog name found.' })
        }
        const blog = await getParticularBlogsConditionModel({ 'posts.status': 1, 'posts.id': blogId });
        return res.status(200).json({ status: true, msg: 'Particular blog found!', blog: blog })
    } catch (error) {
        next(error)
    }
})


const getSearchBlogs = asyncHandler(async (req, res, next) => {
    try {
        const searchData = req?.body?.search;
        if (!searchData) {
            return res.status(200).json({ status: true, msg: 'No Search posts found...', searchPost: [] })
        }
        const blogs = await getSearchPostsLatestModel(searchData);
        return res.status(200).json({ status: true, msg: 'Search posts...', blogs: blogs })
    } catch (error) {
        next(error)
    }
})

const getTotalCategoryBlogs = asyncHandler(async (req, res, next) => {
    try {
        const catBlogs = await getTotalCategoryBlogsModel();
        return res.status(200).json({ status: true, msg: 'All category posts...', catBlogs: catBlogs })
    } catch (error) {
        next(error)
    }
})

const getTrendingBlogs = asyncHandler(async (req, res, next) => {
    try {
        const blogs = await getTrendingBlogsModel();
        return res.status(200).json({ status: true, msg: 'All category posts...', blogs: blogs })
    } catch (error) {
        next(error)
    }
})

module.exports = { getAllPages, getParticularPage, getFaqPage, getAllBlogs, getParticularBlog, getSearchBlogs, getTotalCategoryBlogs, getTrendingBlogs }