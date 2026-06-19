const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getAllPagesConditionModel, getParticularPagesConditionModel } = require('../../model/service/pageModel');
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

module.exports = {getAllPages, getParticularPage}