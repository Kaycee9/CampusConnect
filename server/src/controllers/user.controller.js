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
    
    const {
      firstName, lastName, phone, address, 
      bio, category, startingPrice, yearsExp
    } = req.body;

    let avatarUrl = undefined;

    // Handle Image Upload if file is present
    if (req.file) {
      try {
        const result = await uploadStream(req.file.buffer, {
          folder: 'campus-connect/avatars',
          transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
        });
        avatarUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failure:', uploadError);
        return res.status(500).json({ error: 'Failed to upload profile image' });
      }
    }

    let updatedProfile;

    // firstName and lastName live on the PROFILE models, not on User
    if (role === 'STUDENT') {
      updatedProfile = await db.studentProfile.update({
        where: { userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(address && { address }),
          ...(avatarUrl && { avatarUrl }),
        },
      });
    } else if (role === 'ARTISAN') {
      updatedProfile = await db.artisanProfile.update({
        where: { userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
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

    // Fetch the complete user object for the response
    const fullUser = await db.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, artisanProfile: true },
    });

    const { passwordHash: _, ...userWithoutPassword } = fullUser;

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error while updating profile' });
  }
};
