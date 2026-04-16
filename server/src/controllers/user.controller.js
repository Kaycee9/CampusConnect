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

const isCloudinaryTimeout = (error) => {
  return error?.name === 'TimeoutError' || error?.http_code === 499;
};

const uploadAvatarWithFallback = async (buffer) => {
  const baseOptions = {
    folder: 'campus-connect/avatars',
    resource_type: 'image',
    timeout: 120000,
  };

  try {
    return await uploadStream(buffer, {
      ...baseOptions,
      transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
    });
  } catch (error) {
    if (!isCloudinaryTimeout(error)) {
      throw error;
    }

    // Fallback avoids face detection processing when Cloudinary is slow.
    return uploadStream(buffer, {
      ...baseOptions,
      transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'auto' }],
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const {
      firstName, lastName, phone, address,
      lat, lng, bio, category, startingPrice, yearsExp
    } = req.body;

    let avatarUrl = undefined;

    // Handle Image Upload if file is present
    if (req.file) {
      try {
        const result = await uploadAvatarWithFallback(req.file.buffer);
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
          ...(typeof lat === 'number' && { lat }),
          ...(typeof lng === 'number' && { lng }),
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
          ...(typeof lat === 'number' && { lat }),
          ...(typeof lng === 'number' && { lng }),
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
