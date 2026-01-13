const Research = require('../models/Research');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// @desc    Get research submissions
// @route   GET /api/research
// @access  Private
const getResearch = async (req, res) => {
  try {
    const { userId } = req.query;

    if (userId) {
        if (req.user.role === 'STUDENT' && req.user.id !== userId) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const research = await Research.find({ studentId: userId }).sort({ submittedAt: -1 });
        return res.status(200).json({ success: true, data: research });
    } else {
        if (req.user.role === 'STUDENT') {
             const research = await Research.find({ studentId: req.user.id }).sort({ submittedAt: -1 });
             return res.status(200).json({ success: true, data: research });
        }
        const research = await Research.find().sort({ submittedAt: -1 });
        return res.status(200).json({ success: true, data: research });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create research submission
// @route   POST /api/research
// @access  Private (Student)
const createResearch = async (req, res) => {
  try {
    const { title, abstract } = req.body;
    
    let fileUrl = '';
    let fileId = null;
    let originalFileName = '';

    if (req.file) {
        fileUrl = req.file.filename; // Temporary filename
        originalFileName = req.file.originalname;

        // Move to GridFS manually to ensure reliability
        try {
            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                bucketName: 'uploads'
            });
            const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
            
            console.log(`[Research] Streaming ${filePath} to GridFS...`);
            
            const uploadStream = bucket.openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype
            });
            
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(uploadStream)
                    .on('error', reject)
                    .on('finish', resolve);
            });
            
            fileId = uploadStream.id;
            console.log(`[Research] Moved to GridFS: ${fileId}`);
            
            // Delete local file
            fs.unlinkSync(filePath);
            
        } catch (e) {
            console.error('[Research] GridFS Upload Error:', e);
            // Fallback: fileUrl is already set to local filename if upload failed but file exists
        }
    } else if (req.body.fileUrl) {
        // Fallback for legacy or URL inputs
        fileUrl = req.body.fileUrl;
    }

    const research = await Research.create({
        studentId: req.user.id,
        studentName: req.user.name,
        title,
        abstract,
        fileUrl,
        fileId,
        originalFileName,
        status: 'PENDING',
        submittedAt: Date.now()
    });

    res.status(201).json({ success: true, data: research });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review research
// @route   PUT /api/research/:id/review
// @access  Private (Instructor)
const reviewResearch = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const research = await Research.findById(req.params.id);

    if (!research) {
        return res.status(404).json({ success: false, message: 'Research not found' });
    }

    research.status = status;
    research.instructorFeedback = feedback;
    research.reviewedBy = req.user.id;
    research.reviewedAt = Date.now();
    await research.save();

    res.status(200).json({ success: true, data: research });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download research document
// @route   GET /api/research/:id/download
// @access  Private (Instructor/Admin)
const downloadResearch = async (req, res) => {
    try {
        const research = await Research.findById(req.params.id);
        if (!research) {
            return res.status(404).json({ success: false, message: 'Research not found' });
        }

        if (req.user.role === 'STUDENT' && research.studentId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (research.fileId) {
            try {
                const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                    bucketName: 'uploads'
                });

                const downloadStream = bucket.openDownloadStream(research.fileId);
                
                res.set('Content-Type', 'application/pdf'); // Generic fallback or store mime type
                res.set('Content-Disposition', `attachment; filename="${research.originalFileName || research.fileUrl}"`);
                
                downloadStream.pipe(res);
                
                downloadStream.on('error', (error) => {
                     console.error('[Research] GridFS Download Error:', error);
                     res.status(404).json({ success: false, message: 'File not found in GridFS' });
                });
                return;
            } catch (e) {
                console.error('[Research] GridFS Setup Error:', e);
            }
        }

        // Fallback for legacy files (local)
        const fileUrl = research.fileUrl;
        if (fileUrl.startsWith('http')) {
            return res.redirect(fileUrl);
        }

        const filePath = path.resolve(__dirname, '../../', fileUrl); // Adjust path as needed
        if (fs.existsSync(filePath)) {
            return res.download(filePath);
        }

        return res.status(404).json({ success: false, message: 'File not found on server', path: fileUrl });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
  getResearch,
  createResearch,
  reviewResearch,
  downloadResearch
};
