const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getAllPostsConditionModel, getAllCategorysConditionModel, getParticularPostModel, getAllPostsByCategoryModel } = require('../../model/service/postModel');


const getAllPost = asyncHandler(async (req, res) => {
    try {
        const Post = await getAllPostsConditionModel({ status: 1 });
        return res.status(200).json({ status: true, msg: 'All Post..', posts: Post })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getParticularPost = asyncHandler(async (req, res) => {
    try {
        const postId = req.query?.id;
        console.log(postId)
        const Post = await getParticularPostModel({ status: 1, id: postId });
        return res.status(200).json({ status: true, msg: 'All Post..', posts: Post })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getCategory = asyncHandler(async (req, res) => {
    try {
        const category = await getAllCategorysConditionModel({ status: 1, showleft: 1 });
        return res.status(200).json({ status: true, msg: 'Category..', category: category })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getPostByCategory = asyncHandler(async (req, res) => {
    try {
        if (!req?.query?.cat) {
            return res.status(400).json({ status: false, msg: 'Please enter valid Post.' })
        }
        const Post = await getAllPostsByCategoryModel({ slug: req?.query?.cat });
        return res.status(200).json({ status: true, msg: 'Post..', posts: Post })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

module.exports = { getAllPost, getParticularPost, getCategory, getPostByCategory }