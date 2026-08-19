const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getAllZoneModel, createZoneModel, setZoneModel, deleteZoneModel, getAllZoneConditionModel, getParticularZoneModel } = require('../../../model/admin/service/adminZoneModel');
var slugify = require('slugify');
const { deleteFile } = require('../../../helper/deleteHelper');
const { urlDecode } = require('../../../helper/urlHelper');

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
            parent_id: !req?.body?.parent_id ? null : req?.body?.parent_id == 'null' ? null : req?.body?.parent_id,
            top_trending: req?.body?.top_trending == 'true' || req?.body?.top_trending === true || req?.body?.top_trending == 1 || req?.body?.top_trending == '1' ? 1 : 0,
            top_destination: req?.body?.top_destination == 'true' || req?.body?.top_destination === true || req?.body?.top_destination == 1 || req?.body?.top_destination == '1' ? 1 : 0,
            show_in_corporate: req?.body?.show_in_corporate == 'true' || req?.body?.show_in_corporate === true || req?.body?.show_in_corporate == 1 || req?.body?.show_in_corporate == '1' ? 1 : 0,
            corporate_tag: req?.body?.corporate_tag || null,
            showing_text: req?.body?.showing_text,
            meta_title: req?.body?.meta_title || req?.body?.name,
            meta_description: req?.body?.meta_description || req?.body?.description,
            meta_keywords: req?.body?.meta_keywords || (Array.isArray(req?.body?.tags) ? req.body.tags.join(', ') : req?.body?.tags) || null,
            tags: req?.body?.tags ? (Array.isArray(req?.body?.tags) ? req.body.tags.join(', ') : req?.body?.tags) : null,
            canonical_url: req?.body?.canonical_url || null,
            og_title: req?.body?.og_title || req?.body?.meta_title || req?.body?.name,
            og_description: req?.body?.og_description || req?.body?.meta_description || req?.body?.description,
            robots_meta: req?.body?.robots_meta || 'index, follow',
            slug: slugify(req?.body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }),
            image: null,
            tourist_guide: req?.body?.tourist_guide ? (typeof req.body.tourist_guide === 'object' ? JSON.stringify(req.body.tourist_guide) : req.body.tourist_guide) : null
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
        const particularZone = await getParticularZoneModel({id: req?.body?.id});
        if (!particularZone && particularZone.length == 0) {
            return res.status(400).json({ status: false, msg: 'No Zone found!' })
        }
        const zoneData = {
            name: req?.body?.name,
            description: req?.body?.description,
            sort_order: req?.body?.sort_order,
            top_trending: req?.body?.top_trending == 'true' || req?.body?.top_trending === true || req?.body?.top_trending == 1 || req?.body?.top_trending == '1' ? 1 : 0,
            top_destination: req?.body?.top_destination == 'true' || req?.body?.top_destination === true || req?.body?.top_destination == 1 || req?.body?.top_destination == '1' ? 1 : 0,
            show_in_corporate: req?.body?.show_in_corporate == 'true' || req?.body?.show_in_corporate === true || req?.body?.show_in_corporate == 1 || req?.body?.show_in_corporate == '1' ? 1 : 0,
            corporate_tag: req?.body?.corporate_tag || null,
            showing_text: req?.body?.showing_text,
            meta_title: req?.body?.meta_title || req?.body?.name,
            meta_description: req?.body?.meta_description || req?.body?.description,
            meta_keywords: req?.body?.meta_keywords || (Array.isArray(req?.body?.tags) ? req.body.tags.join(', ') : req?.body?.tags) || null,
            tags: req?.body?.tags ? (Array.isArray(req?.body?.tags) ? req.body.tags.join(', ') : req?.body?.tags) : null,
            canonical_url: req?.body?.canonical_url || null,
            og_title: req?.body?.og_title || req?.body?.meta_title || req?.body?.name,
            og_description: req?.body?.og_description || req?.body?.meta_description || req?.body?.description,
            robots_meta: req?.body?.robots_meta || 'index, follow',
            slug: slugify(req?.body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }),
            tourist_guide: req?.body?.tourist_guide !== undefined ? (typeof req.body.tourist_guide === 'object' ? JSON.stringify(req.body.tourist_guide) : req.body.tourist_guide) : null
        }
        if (req.file) {
            zoneData.image = req.file.path;
            if (particularZone[0]?.image) {
                await deleteFile(particularZone[0]?.image);
            }
        }
        if (req?.body?.parent_id && req?.body?.parent_id != 'null') {
            zoneData.parent_id = req?.body?.parent_id
        }
        const zone = await setZoneModel(zoneData, req?.body?.id);
        return res.status(200).json({ status: true, msg: 'zone update successfully.', zone: zone })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

// Helper function to recursively find all descendant IDs and images
const getAllDescendantZones = async (parentZoneId) => {
    let results = [];
    
    // 1. Fetch immediate children using your model function 
    // (Adjust the query criteria object based on how your getParticularZoneModel is written)
    const children = await getParticularZoneModel({ parent_id: parentZoneId });
    
    if (children && children.length > 0) {
        for (const child of children) {
            // Add the child's info to our list
            results.push({
                id: child.id,
                image: child.image
            });
            
            const deeperChildren = await getAllDescendantZones(child.id);
            results = results.concat(deeperChildren);
        }
    }
    
    return results;
};

const deleteZone = asyncHandler(async (req, res) => {
    try {
        const zoneId = req?.query?.id ? urlDecode(req?.query?.id) : '';
        if (!zoneId) {
            return res.status(400).json({ status: false, msg: 'Please select a valid zone id.' });
        }

        const particularZone = await getParticularZoneModel({ id: zoneId });
        if (!particularZone || particularZone.length === 0) {
            return res.status(404).json({ status: false, msg: 'Zone not found.' });
        }

        const descendants = await getAllDescendantZones(zoneId);
        
        const allZonesToDelete = [
            { id: particularZone[0].id, image: particularZone[0].image },
            ...descendants
        ];

        for (const zoneItem of allZonesToDelete) {
            if (zoneItem?.image) {
                try {
                    await deleteFile(zoneItem.image);
                } catch (fileErr) {
                    console.error(`Failed to delete file for zone ${zoneItem.id}:`, fileErr);
                }
            }
        }

        const zone = await deleteZoneModel(zoneId);
        
        for (const zoneItem of allZonesToDelete) {
            await deleteZoneModel(zoneItem.id);
        }

        return res.status(200).json({ 
            status: true, 
            msg: 'Zone and all associated sub-zones along with their files deleted successfully.', 
            deletedCount: allZonesToDelete.length 
        });

    } catch (error) {
        console.error("Delete Zone Error: ", error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});


module.exports = {
    getAllZone,
    getZone,
    createZone,
    getParticularZone,
    setZone,
    deleteZone
}

