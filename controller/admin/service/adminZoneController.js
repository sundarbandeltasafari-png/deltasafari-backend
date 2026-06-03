const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getAllZoneModel, createZoneModel, setZoneModel, deleteZoneModel, getAllZoneConditionModel, getParticularZoneModel } = require('../../../model/admin/service/adminZoneModel');
var slugify = require('slugify');
const { deleteFile } = require('../../../helper/deleteHelper');

const zoneChild = async (id = '') => {
    try {
        var category = await getAllZoneConditionModel({ parent_id: id, status: 1 });
        return Promise.all(
            category.map(async (cat) => {
                const children = await zoneChild(cat?.id);
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

const getAllZone = asyncHandler(async (req, res) => {
    try {
        const zone = await zoneChild();
        return res.status(200).json({ status: true, msg: 'All zone..', zone: zone })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getZone = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.condition) {
            return res.status(400).json({ status: false, msg: 'Please enter valid zone.' })
        }
        const zone = await getAllZoneConditionModel(req?.body?.condition);
        return res.status(200).json({ status: true, msg: 'zone..', zone: zone })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getParticularZone = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.condition) {
            return res.status(400).json({ status: false, msg: 'Please enter valid zone.' })
        }
        const zone = await getParticularZoneModel(req?.body?.condition);
        return res.status(200).json({ status: true, msg: 'zone..', zone: zone.length > 0 ? zone[0] : [] })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const createZone = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.name && !req?.body?.description && !req?.body?.sort_order) {
            return res.status(400).json({ status: false, msg: 'Please enter valid category details.' })
        }
        const zoneData = {
            name: req?.body?.name,
            description: req?.body?.description,
            sort_order: req?.body?.sort_order,
            parent_id: req?.body?.parent_id ? req?.body?.parent_id : null,
            showleft: req?.body?.showleft == true ? 1 : 0,
            slug: slugify(req?.body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }),
            image: null
        }
        if (req.file) {
            zoneData.image = req.file.path;
        }
        const zone = await createZoneModel(zoneData);
        return res.status(200).json({ status: true, msg: 'zone created successfully..', zone: zone })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const setZone = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.name && !req?.body?.description && !req?.body?.sort_order) {
            return res.status(400).json({ status: false, msg: 'Please enter valid Zone details.' })
        }
        const particularZone = await getParticularZoneModel(req?.body?.id);
        if (!particularZone && particularZone.length == 0) {
            return res.status(400).json({ status: false, msg: 'No Zone found!' })
        }
        const zoneData = {
            name: req?.body?.name,
            description: req?.body?.description,
            sort_order: req?.body?.sort_order,
            showleft: req?.body?.showleft == true ? 1 : 0,
            slug: slugify(req?.body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true })
        }
        if (req.file) {
            zoneData.image = req.file.path;
        }
        if (req?.body?.parent_id && req?.body?.parent_id != 'null') {
            zoneData.parent_id = req?.body?.parent_id
        }
        const zone = await setZoneModel(zoneData, req?.body?.id);
        if (particularZone[0]?.image) {
            await deleteFile(particularZone[0]?.image);
        }
        return res.status(200).json({ status: true, msg: 'zone update successfully.', zone: zone })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const deleteZone = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid language.' })
        }
        const zone = await deleteZoneModel(req?.body?.id);
        return res.status(200).json({ status: true, msg: 'zone update successfully.', zone: zone })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


module.exports = {
    getAllZone,
    getZone,
    createZone,
    getParticularZone,
    setZone,
    deleteZone
}

