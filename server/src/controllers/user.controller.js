import db from '../config/database.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Helper to upload a buffer to Cloudinary via stream
 */
const uploadStream = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Extracted from req.body (Zod will validate this in the route)
    const {
      firstName, lastName, phone, address, 
      // Artisan specific
      bio, category, startingPrice, yearsExp
    } = req.body;

    let avatarUrl = undefined;

    // Handle Image Upload if file is present
    if (req.file) {
      try {
        const result = await uploadStream(req.file.buffer, {
          folder: 'campus-connect/avatars',
          transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }], // Pre-crop to 500x500
        });
        avatarUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failure:', uploadError);
        return res.status(500).json({ error: 'Failed to upload profile image' });
      }
    }

    // 1. Update base User record (First/Last name)
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
    });

    let updatedProfile;

    // 2. Update specific Profile record
    if (role === 'STUDENT') {
      updatedProfile = await db.studentProfile.update({
        where: { userId },
        data: {
          ...(phone && { phone }),
          ...(address && { address }),
          ...(avatarUrl && { avatarUrl }),
        },
      });
    } else if (role === 'ARTISAN') {
      updatedProfile = await db.artisanProfile.update({
        where: { userId },
        data: {
          ...(phone && { phone }),
          ...(address && { address }),
          ...(bio && { bio }),
          ...(category && { category }),
          ...(startingPrice && { startingPrice: Number(startingPrice) }),
          ...(yearsExp && { yearsExp: Number(yearsExp) }),
          ...(avatarUrl && { avatarUrl }),
        },
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        ...(role === 'STUDENT' ? { studentProfile: updatedProfile } : { artisanProfile: updatedProfile })
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error while updating profile' });
  }
};
