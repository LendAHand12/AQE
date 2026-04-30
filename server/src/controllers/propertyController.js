import Property from '../models/Property.js';

// @desc    Create a new property
// @route   POST /api/admin/properties
export const createProperty = async (req, res) => {
    try {
        const propertyData = req.body;
        
        // Handle images if uploaded
        if (req.files && req.files.length > 0) {
            propertyData.images = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Parse preSales if it's a string from form-data
        if (typeof propertyData.preSales === 'string') {
            propertyData.preSales = JSON.parse(propertyData.preSales);
        }

        const property = await Property.create(propertyData);
        res.status(201).json(property);
    } catch (error) {
        console.error('Create property error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all properties
// @route   GET /api/admin/properties
export const getProperties = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = { isDeleted: false };
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const properties = await Property.find(query).sort({ createdAt: -1 });
        res.status(200).json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get property by ID
// @route   GET /api/admin/properties/:id
export const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id);
        if (!property || property.isDeleted) {
            return res.status(404).json({ message: 'Không tìm thấy dự án' });
        }
        res.status(200).json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a property
export const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            // If they provided existing images in body, merge them
            const existingImages = updateData.images ? (Array.isArray(updateData.images) ? updateData.images : [updateData.images]) : [];
            updateData.images = [...existingImages, ...newImages];
        }

        const property = await Property.findByIdAndUpdate(id, updateData, { new: true });
        if (!property) return res.status(404).json({ message: 'Không tìm thấy dự án' });
        
        res.status(200).json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a property
export const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!property) return res.status(404).json({ message: 'Không tìm thấy dự án' });
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
