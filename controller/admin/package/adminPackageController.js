const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const fs = require('fs');
const path = require('path');
const { getAllPackageTypesModel, createPackageModel, createPackageAssetsModel, createPackageItinerariesModel, createPackagePoliciesModel, getAllPackageModel, getAllPackageItinerariesModel, getAllPackageAssetsModel, getAllPackagePoliciesModel, setPackageModel, getParticularPackageModel, deletePoliciesModel, deleteItinerariesModel, deleteAssets, deletePackageModel, getAllBookingsModel, getRawPackageByIdModel, checkDuplicateSlugModel } = require('../../../model/admin/package/adminPackageModel');
const { getPackageReferenceHotelsModel, linkPackageToHotels } = require('../../../model/admin/service/adminHotelModel');
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
        const generatedSlug = body?.slug
            ? slugify(body.slug, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true })
            : (slugify(body?.name || '', { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }) || Date.now().toString());

        // Check if slug or title already exists
        const existingPackage = await checkDuplicateSlugModel(generatedSlug, null, body?.name);
        if (existingPackage) {
            if (req.files) {
                if (req.files['images[]']) req.files['images[]'].forEach(file => deleteFile(file.path));
                if (req.files['videos[]']) req.files['videos[]'].forEach(file => deleteFile(file.path));
            }
            return res.status(200).json({
                status: false,
                isDuplicateSlug: true,
                msg: `A package with this title or slug already exists ("${existingPackage.title}"). Please choose a unique package title.`
            });
        }

        const payload = {
            title: body?.name,
            description: body?.description,
            sort_order: body?.sort_order,
            meta_title: body?.meta_title,
            meta_description: body?.meta_description,
            tags: body?.tags,
            slug: generatedSlug,
            to_destination: body?.to_destination,
            from_destination: body?.from_destination,
            duration_days: body?.duration_days,
            duration_nights: body?.duration_nights,
            base_price: body?.base_price,
            discount: body?.discount,
            discount_type: body?.discount_type,
            actual_price: body?.actual_price,
            agent_discount: body?.agent_discount || 0,
            agent_actual_price: body?.agent_actual_price || body?.actual_price,
            user_commission: body?.user_commission !== undefined ? Number(body.user_commission) : 500.00,
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
            const dayNumber = day?.dayNumber || day?.day_number;
            const itineraries = {
                package_id: package.insertId,
                day_number: dayNumber,
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

        // Link Reference Hotels
        let hotelIds = [];
        if (body?.hotel_ids) {
            if (Array.isArray(body.hotel_ids)) {
                hotelIds = body.hotel_ids.map(Number).filter(Boolean);
            } else if (typeof body.hotel_ids === 'string') {
                try {
                    hotelIds = JSON.parse(body.hotel_ids).map(Number).filter(Boolean);
                } catch (e) {
                    hotelIds = body.hotel_ids.split(',').map(s => Number(s.trim())).filter(Boolean);
                }
            }
        } else if (body?.reference_hotels) {
            if (Array.isArray(body.reference_hotels)) {
                hotelIds = body.reference_hotels.map(Number).filter(Boolean);
            } else if (typeof body.reference_hotels === 'string') {
                try {
                    hotelIds = JSON.parse(body.reference_hotels).map(Number).filter(Boolean);
                } catch (e) {
                    hotelIds = body.reference_hotels.split(',').map(s => Number(s.trim())).filter(Boolean);
                }
            }
        }
        if (hotelIds.length > 0) {
            await linkPackageToHotels(package.insertId, hotelIds);
        }

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
        package.reference_hotels = await getPackageReferenceHotelsModel(package?.id);
        package.hotel_ids = (package.reference_hotels || []).map(h => h.id);
        return res.status(200).json({ status: true, msg: 'Get Particular package.', package: package })
    } catch (error) {
        next(error)
    }
})

const editPackage = asyncHandler(async (req, res, next) => {
    try {
        const body = req.body;
        const packageId = urlDecode(body?.package_id);
        if (!packageId) {
            const error = new Error('Package is not found. Please edit valid package.');
            res.status(401);
            return next(error);
        }

        const generatedSlug = body?.slug
            ? slugify(body.slug, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true })
            : (slugify(body?.name || '', { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }) || Date.now().toString());

        // Check if slug or title already exists for another package
        const existingPackage = await checkDuplicateSlugModel(generatedSlug, packageId, body?.name);
        if (existingPackage) {
            if (req.files) {
                if (req.files['images[]']) req.files['images[]'].forEach(file => deleteFile(file.path));
                if (req.files['videos[]']) req.files['videos[]'].forEach(file => deleteFile(file.path));
            }
            return res.status(200).json({
                status: false,
                isDuplicateSlug: true,
                msg: `A package with this title or slug already exists ("${existingPackage.title}"). Please choose a unique package title.`
            });
        }

        const payload = {
            title: body?.name,
            description: body?.description,
            sort_order: body?.sort_order,
            meta_title: body?.meta_title,
            meta_description: body?.meta_description,
            tags: body?.tags,
            slug: generatedSlug,
            to_destination: body?.to_destination,
            from_destination: body?.from_destination,
            duration_days: body?.duration_days,
            duration_nights: body?.duration_nights,
            base_price: body?.base_price,
            discount: body?.discount,
            discount_type: body?.discount_type,
            actual_price: body?.actual_price,
            agent_discount: body?.agent_discount || 0,
            agent_actual_price: body?.agent_actual_price || body?.actual_price,
            user_commission: body?.user_commission !== undefined ? Number(body.user_commission) : 500.00,
            package_type: body?.category,
            inclusions: JSON.stringify(body?.inclusions),
            exclusions: JSON.stringify(body?.exclusions)
        };
        const package = await setPackageModel(payload, { id: packageId });
        if (!package) {
            const error = new Error('Package is not updated. Please add required fields');
            res.status(401);
            return next(error);
        }

        const deleteItineraries = await deleteItinerariesModel({ package_id: packageId });
        const itinerariesResponse = deleteItineraries && body?.days && body?.days?.length > 0 && Promise.all(body?.days?.map(async (dayData) => {
            const day = JSON.parse(dayData)
            const dayNumber = day?.dayNumber || day?.day_number
            const itineraries = {
                package_id: packageId,
                day_number: dayNumber,
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

        // Update linked reference hotels
        if (body?.hotel_ids !== undefined || body?.reference_hotels !== undefined) {
            let hotelIds = [];
            const rawHotelData = body?.hotel_ids !== undefined ? body.hotel_ids : body.reference_hotels;
            if (Array.isArray(rawHotelData)) {
                hotelIds = rawHotelData.map(Number).filter(Boolean);
            } else if (typeof rawHotelData === 'string') {
                try {
                    hotelIds = JSON.parse(rawHotelData).map(Number).filter(Boolean);
                } catch (e) {
                    hotelIds = rawHotelData.split(',').map(s => Number(s.trim())).filter(Boolean);
                }
            }
            await linkPackageToHotels(packageId, hotelIds);
        }

        return res.status(200).json({ status: true, msg: 'Package has been updated successfully.' })
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
        await linkPackageToHotels(packageId, []);
        return res.status(200).json({ status: true, msg: 'Package deleted successfully.' })
    } catch (error) {
        console.log(error);
        
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


const getAllBookings = asyncHandler(async (req, res, next) => {
    try {
        const bookings = await getAllBookingsModel();
        return res.status(200).json({ status: true, msg: 'All bookings..', bookings: bookings })
    } catch (error) {
        next(error)
    }
})

const duplicatePackage = asyncHandler(async (req, res, next) => {
    try {
        let packageId = req?.body?.id || req?.query?.id || req?.body?.package_id || req?.query?.package_id;
        if (!packageId) {
            return res.status(400).json({ status: false, msg: 'Please provide a valid package ID to duplicate.' });
        }

        if (isNaN(packageId)) {
            try {
                const decoded = urlDecode(packageId);
                if (decoded) packageId = decoded;
            } catch (e) {
                // Keep original packageId if decoding fails
            }
        }

        // Fetch original package row
        const rawPackageData = await getRawPackageByIdModel(packageId);
        if (!rawPackageData || rawPackageData.length === 0) {
            return res.status(404).json({ status: false, msg: 'Original package not found!' });
        }

        const originalPackage = rawPackageData[0];

        // Omit id and timestamp fields from payload
        const { id, created_at, updated_at, created_on, updated_on, ...packagePayload } = originalPackage;

        const newTitle = req?.body?.title || `${packagePayload.title || 'Package'} (Copy)`;
        const generatedSlug = slugify(newTitle, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }) || Date.now().toString();

        const existingPackage = await checkDuplicateSlugModel(generatedSlug, null, newTitle);
        if (existingPackage) {
            return res.status(200).json({
                status: false,
                isDuplicateSlug: true,
                msg: `A package with the name or slug "${newTitle}" already exists. Please choose a unique title when duplicating.`
            });
        }

        packagePayload.title = newTitle;
        packagePayload.slug = generatedSlug;

        // Insert duplicated package
        const newPackage = await createPackageModel(packagePayload);
        const newPackageId = newPackage?.insertId;

        if (!newPackageId) {
            return res.status(500).json({ status: false, msg: 'Failed to create duplicate package.' });
        }

        // Duplicate itineraries
        const itineraries = await getAllPackageItinerariesModel({ package_id: packageId });
        if (itineraries && itineraries.length > 0) {
            await Promise.all(itineraries.map(async (item) => {
                const { id, created_at, updated_at, created_on, updated_on, package_id, ...itinData } = item;
                itinData.package_id = newPackageId;
                return await createPackageItinerariesModel(itinData);
            }));
        }

        // Duplicate policies
        const policies = await getAllPackagePoliciesModel({ package_id: packageId });
        if (policies && policies.length > 0) {
            await Promise.all(policies.map(async (item) => {
                const { id, created_at, updated_at, created_on, updated_on, package_id, ...polData } = item;
                polData.package_id = newPackageId;
                return await createPackagePoliciesModel(polData);
            }));
        }

        // Duplicate reference hotels
        const refHotels = await getPackageReferenceHotelsModel(packageId);
        if (refHotels && refHotels.length > 0) {
            await linkPackageToHotels(newPackageId, refHotels.map(h => h.id));
        }

        // Duplicate assets
        const assets = await getAllPackageAssetsModel({ package_id: packageId });
        if (assets && assets.length > 0) {
            await Promise.all(assets.map(async (item) => {
                const { id, created_at, updated_at, created_on, updated_on, package_id, ...assetData } = item;
                assetData.package_id = newPackageId;

                if (assetData.path) {
                    try {
                        if (fs.existsSync(assetData.path)) {
                            const ext = path.extname(assetData.path);
                            const dir = path.dirname(assetData.path);
                            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                            const newFileName = `${uniqueSuffix}${ext}`;
                            const newFilePath = path.join(dir, newFileName);

                            await fs.promises.copyFile(assetData.path, newFilePath);
                            assetData.path = newFilePath;
                        }
                    } catch (fileErr) {
                        console.error('Error copying asset file during package duplication:', fileErr);
                    }
                }

                return await createPackageAssetsModel(assetData);
            }));
        }

        return res.status(200).json({
            status: true,
            msg: 'Package duplicated successfully.',
            newPackageId: newPackageId,
            newPackageTitle: newTitle
        });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    getAllPackageType,
    createPackage,
    getAllPackages,
    getParticularPackage,
    editPackage,
    deletePackage,
    getAllBookings,
    duplicatePackage
}