const { Image, User } = require('../models');
const fs = require('fs');
const path = require('path');

// Upload image
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { description } = req.body;
    const userId = req.user.id;

    const image = await Image.create({
      userId,
      filename: req.file.filename,
      filepath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      description,
    });

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        id: image.id,
        filename: image.filename,
        description: image.description,
        createdAt: image.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
};

// Get user's images
exports.getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;

    const images = await Image.findAll({
      where: { userId },
      attributes: ['id', 'filename', 'description', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    res.json({ images });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ message: 'Failed to fetch images', error: error.message });
  }
};

// Download image
exports.downloadImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.id;

    const image = await Image.findByPk(imageId);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if user owns the image or is admin
    if (image.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.download(image.filepath, image.filename);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to download image', error: error.message });
  }
};

// Delete image
exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.id;

    const image = await Image.findByPk(imageId);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (image.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from storage
    if (fs.existsSync(image.filepath)) {
      fs.unlinkSync(image.filepath);
    }

    await image.destroy();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
};
