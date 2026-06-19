const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getAllPackageTypesModel, createPackageModel, createPackageAssetsModel, createPackageItinerariesModel, createPackagePoliciesModel, getAllPackageModel, getAllPackageItinerariesModel, getAllPackageAssetsModel, getAllPackagePoliciesModel, setPackageModel, getParticularPackageModel, deletePoliciesModel, deleteItinerariesModel, deleteAssets, deletePackageModel } = require('../../../model/admin/package/adminPackageModel');
const slugify = require('slugify');
const { urlDecode } = require('../../../helper/urlHelper');
const { deleteFile } = require('../../../helper/deleteHelper');


const getAllPackageType = asyncHandler(async (req, res, next) => {
    try {
        const packageTypes = await getAllPackageTypesModel({ status: 1 });
        return res.status(200).json({ status: true, msg: 'All PackageTypes..', packageTypes: packageTypes })
    } catch (error) {
        next(error)
    }
})

const createPackage = asyncHandler(async (req, res, next) => {
    try {
        const body = req.body;
        console.log(body?.days)
        const payload = {
            title: body?.name,
            description: body?.description,
            sort_order: body?.sort_order,
            meta_title: body?.meta_title,
            meta_description: body?.meta_description,
            tags: body?.tags,
            slug: slugify(body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }) || Date.now(),
            to_destination: body?.to_destination,
            from_destination: body?.from_destination,
            duration_days: body?.duration_days,
            duration_nights: body?.duration_nights,
            base_price: body?.base_price,
            discount: body?.discount,
            discount_type: body?.discount_type,
            actual_price: body?.actual_price,
            package_type: body?.category,
            inclusions: JSON.stringify(body?.inclusions),
            exclusions: JSON.stringify(body?.exclusions)
        };
        const package = await createPackageModel(payload);
        if (!package.insertId) {
            const error = new Error('Package is not created. Please add required fields');
            res.status(401);
            next(error);
        }

        const itinerariesResponse = body?.days && body?.days?.length > 0 && Promise.all(body?.days?.map(async (dayData) => {
            const day = JSON.parse(dayData)
            const itineraries = {
                package_id: package.insertId,
                day_number: day?.dayNumber,
                title: day?.title,
                roadmap: JSON.stringify(day?.roadmap),
                details: day?.details
            }
            return await createPackageItinerariesModel(itineraries);
        }))

        const policiesResponse = body?.policies && body?.policies?.length > 0 && Promise.all(body?.policies?.map(async (policyData) => {
            const policy = JSON.parse(policyData)
            const policies = {
                package_id: package.insertId,
                title: policy?.title,
                bullets: JSON.stringify(policy?.bullets)
            }
            return await createPackagePoliciesModel(policies);
        }))

        const imageAssets = req.files['images[]'] && req.files['images[]'].length > 0 && Promise.all(req.files['images[]'].map(async (imageFile) => {
            return await createPackageAssetsModel({ path: imageFile.path, package_id: package.insertId });
        }));
        const videoAssets = req.files['videos[]'] && req.files['videos[]'].length > 0 && Promise.all(req.files['videos[]'].map(async (videoFile) => {
            return await createPackageAssetsModel({ path: videoFile.path, package_id: package.insertId, type: 2 });
        }));

        return res.status(200).json({ status: true, msg: 'Package has been created successfully.', videos: videoAssets, image: imageAssets })
    } catch (error) {
        next(error)
    }
})

const getAllPackages = asyncHandler(async (req, res, next) => {
    try {
        const packages = await getAllPackageModel();
        return res.status(200).json({ status: true, msg: 'Display all packages.', packages: packages })
    } catch (error) {
        next(error)
    }
})

const getParticularPackage = asyncHandler(async (req, res, next) => {
    try {
        const packageId = req.query?.id && urlDecode(req?.query?.id);
        if (!packageId) {
            return res.status(400).json({ status: false, msg: 'No package id found!' })
        }
        const packageData = await getParticularPackageModel({ "packages_master.id": packageId });
        const package = packageData.length > 0 ? packageData[0] : null;
        if (!package) {
            return res.status(400).json({ status: false, msg: 'No package found!' })
        }
        package.itineraries = await getAllPackageItinerariesModel({ package_id: package?.id });
        package.assets = await getAllPackageAssetsModel({ package_id: package?.id });
        package.policies = await getAllPackagePoliciesModel({ package_id: package?.id });
        return res.status(200).json({ status: true, msg: 'Get Particular package.', package: package })
    } catch (error) {
        next(error)
    }
})

const editPackage = asyncHandler(async (req, res, next) => {
    try {
        const body = req.body;
        const payload = {
            title: body?.name,
            description: body?.description,
            sort_order: body?.sort_order,
            meta_title: body?.meta_title,
            meta_description: body?.meta_description,
            tags: body?.tags,
            slug: slugify(body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }) || Date.now(),
            to_destination: body?.to_destination,
            from_destination: body?.from_destination,
            duration_days: body?.duration_days,
            duration_nights: body?.duration_nights,
            base_price: body?.base_price,
            discount: body?.discount,
            discount_type: body?.discount_type,
            actual_price: body?.actual_price,
            package_type: body?.category,
            inclusions: JSON.stringify(body?.inclusions),
            exclusions: JSON.stringify(body?.exclusions)
        };
        const packageId = urlDecode(body?.package_id);
        if (!packageId) {
            const error = new Error('Package is not found. Please edit valid package.');
            res.status(401);
            next(error);
        }
        const package = await setPackageModel(payload, { id: packageId });
        if (!package) {
            const error = new Error('Package is not updated. Please add required fields');
            res.status(401);
            next(error);
        }

        const deleteItineraries = await deleteItinerariesModel({ package_id: packageId });
        const itinerariesResponse = deleteItineraries && body?.days && body?.days?.length > 0 && Promise.all(body?.days?.map(async (dayData) => {
            const day = JSON.parse(dayData)
            const itineraries = {
                package_id: packageId,
                day_number: day?.dayNumber,
                title: day?.title,
                roadmap: JSON.stringify(day?.roadmap),
                details: day?.details
            }
            return await createPackageItinerariesModel(itineraries);
        }))

        const deletePolicies = await deletePoliciesModel({ package_id: packageId });
        const policiesResponse = deletePolicies && body?.policies && body?.policies?.length > 0 && Promise.all(body?.policies?.map(async (policyData) => {
            const policy = JSON.parse(policyData)
            const policies = {
                package_id: packageId,
                title: policy?.title,
                bullets: JSON.stringify(policy?.bullets)
            }
            return await createPackagePoliciesModel(policies);
        }))

        body?.delAssets && Promise.all(body?.delAssets?.map(async (delAsset) => {
            const delAssets = JSON.parse(delAsset)
            deleteFile(delAssets.path);
            await deleteAssets({ id: delAssets.id });
        }))

        const imageAssets = req.files['images[]'] && req.files['images[]'].length > 0 && Promise.all(req.files['images[]'].map(async (imageFile) => {
            return await createPackageAssetsModel({ path: imageFile.path, package_id: packageId });
        }));
        const videoAssets = req.files['videos[]'] && req.files['videos[]'].length > 0 && Promise.all(req.files['videos[]'].map(async (videoFile) => {
            return await createPackageAssetsModel({ path: videoFile.path, package_id: packageId, type: 2 });
        }));

        return res.status(200).json({ status: true, msg: 'Package has been created successfully.' })
    } catch (error) {
        next(error)
    }
})

const deletePackage = asyncHandler(async (req, res) => {
    try {
        const packageId = req?.query?.id ? urlDecode(req?.query?.id) : ''
        if (!packageId) {
            return res.status(400).json({ status: false, msg: 'Please select a valid package id.' })
        }
        const packageAssetsData = await getAllPackageAssetsModel({ package_id: packageId });;
        if (packageAssetsData.length > 0) {
            Promise.all(packageAssetsData.map(async (asset) => {
                if (asset.path) {
                    await deleteFile(asset.path);
                }
                return deleteAssets({ id: asset?.id });
            }));
        }
        await deletePackageModel({ id: packageId });
        await deleteItinerariesModel({ package_id: packageId });
        await deletePoliciesModel({ package_id: packageId });
        return res.status(200).json({ status: true, msg: 'Package deleted successfully.' })
    } catch (error) {
        console.log(error);
        
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

module.exports = {
    getAllPackageType,
    createPackage,
    getAllPackages,
    getParticularPackage,
    editPackage,
    deletePackage
}