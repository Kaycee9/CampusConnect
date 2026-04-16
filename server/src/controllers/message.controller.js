import db from '../config/database.js';
import { sendEmail } from '../utils/email.js';

const getProfile = (user) => user.studentProfile || user.artisanProfile || null;

const getDisplayName = (user) => {
  const profile = getProfile(user);
  if (!profile) return user.email;
  return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.email;
};

const getAvatarUrl = (user) => {
  const profile = getProfile(user);
  return profile?.avatarUrl || null;
};

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  fullName: getDisplayName(user),
  avatarUrl: getAvatarUrl(user),
  studentProfile: user.studentProfile || null,
  artisanProfile: user.artisanProfile || null,
});

const serializeMessage = (message) => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  content: message.content,
  isRead: message.isRead,
  createdAt: message.createdAt,
  sender: serializeUser(message.sender),
});

const serializeConversation = (conversation, currentUserId, unreadCount = 0) => {
  const otherUser = conversation.user1Id === currentUserId ? conversation.user2 : conversation.user1;
  const lastMessage = conversation.messages?.[0] || null;

  return {
    id: conversation.id,
    bookingId: conversation.bookingId || null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    otherUser: otherUser ? serializeUser(otherUser) : null,
    lastMessage: lastMessage ? serializeMessage(lastMessage) : null,
    booking: conversation.booking
      ? {
        id: conversation.booking.id,
        title: conversation.booking.title,
        status: conversation.booking.status,
        agreedPrice: conversation.booking.agreedPrice,
        scheduledAt: conversation.booking.scheduledAt,
        address: conversation.booking.address,
      }
      : null,
    unreadCount,
  };
};

const getConversationAccess = async (conversationId, userId) => {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      booking: true,
      user1: { include: { studentProfile: true, artisanProfile: true } },
      user2: { include: { studentProfile: true, artisanProfile: true } },
    },
  });

  if (!conversation) {
    return { conversation: null, isAllowed: false };
  }

  const isAllowed = conversation.user1Id === userId || conversation.user2Id === userId;
  return { conversation, isAllowed };
};

const resolveParticipantId = async ({ currentUserId, currentRole, participantId, bookingId }) => {
  if (participantId) {
    return participantId;
  }

  if (!bookingId) {
    return null;
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { artisan: true, conversation: true },
  });

  if (!booking) {
    return null;
  }

  if (currentRole === 'STUDENT') {
    if (booking.studentId !== currentUserId) {
      return null;
    }
    return booking.artisan.userId;
  }

  if (currentRole === 'ARTISAN') {
    if (booking.artisan.userId !== currentUserId) {
      return null;
    }
    return booking.studentId;
  }

  return null;
};

const createOrFetchConversation = async (currentUserId, participantId, bookingId = null) => {
  if (bookingId) {
    const existingByBooking = await db.conversation.findUnique({
      where: { bookingId },
      include: {
        booking: true,
        user1: { include: { studentProfile: true, artisanProfile: true } },
        user2: { include: { studentProfile: true, artisanProfile: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { include: { studentProfile: true, artisanProfile: true } },
          },
        },
      },
    });

    if (existingByBooking) {
      return existingByBooking;
    }

    const [user1Id, user2Id] = [currentUserId, participantId].sort();

    try {
      return await db.conversation.create({
        data: { user1Id, user2Id, bookingId },
        include: {
          booking: true,
          user1: { include: { studentProfile: true, artisanProfile: true } },
          user2: { include: { studentProfile: true, artisanProfile: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: { include: { studentProfile: true, artisanProfile: true } },
            },
          },
        },
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        const fallback = await db.conversation.findUnique({
          where: { bookingId },
          include: {
            booking: true,
            user1: { include: { studentProfile: true, artisanProfile: true } },
            user2: { include: { studentProfile: true, artisanProfile: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { include: { studentProfile: true, artisanProfile: true } },
              },
            },
          },
        });

        if (fallback) {
          return fallback;
        }
      }

      throw error;
    }
  }

  const [user1Id, user2Id] = [currentUserId, participantId].sort();

  const existing = await db.conversation.findFirst({
    where: {
      user1Id,
      user2Id,
      bookingId: null,
    },
    include: {
      booking: true,
      user1: { include: { studentProfile: true, artisanProfile: true } },
      user2: { include: { studentProfile: true, artisanProfile: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { include: { studentProfile: true, artisanProfile: true } },
        },
      },
    },
  });

  if (existing) {
    return existing;
  }

  return db.conversation.create({
    data: { user1Id, user2Id, ...(bookingId ? { bookingId } : {}) },
    include: {
      booking: true,
      user1: { include: { studentProfile: true, artisanProfile: true } },
      user2: { include: { studentProfile: true, artisanProfile: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { include: { studentProfile: true, artisanProfile: true } },
        },
      },
    },
  });
};

const getUnreadCounts = async (conversationIds, currentUserId) => {
  if (conversationIds.length === 0) {
    return {};
  }

  const unreadMessages = await db.message.findMany({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: currentUserId },
      isRead: false,
    },
    select: { conversationId: true },
  });

  return unreadMessages.reduce((counts, message) => {
    counts[message.conversationId] = (counts[message.conversationId] || 0) + 1;
    return counts;
  }, {});
};

const emitConversationEvent = (req, eventName, conversation, payload) => {
  const io = req.app.get('io');
  if (!io) return;

  const rooms = [conversation.user1Id, conversation.user2Id].map((userId) => `user:${userId}`);
  rooms.forEach((room) => {
    io.to(room).emit(eventName, payload);
  });
};

const FINALIZATION_NOTIFICATION_TYPE = 'BOOKING_FINALIZATION';

const getPendingFinalizationProposal = async (booking) => {
  const finalizationEvents = await db.notification.findMany({
    where: {
      type: FINALIZATION_NOTIFICATION_TYPE,
      userId: { in: [booking.studentId, booking.artisan.userId] },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return finalizationEvents.find((event) => {
    const metadata = event.metadata || {};
    return metadata.bookingId === booking.id && metadata.state === 'PENDING';
  }) || null;
};

export const listConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { user1Id: currentUserId },
          { user2Id: currentUserId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        booking: true,
        user1: { include: { studentProfile: true, artisanProfile: true } },
        user2: { include: { studentProfile: true, artisanProfile: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { include: { studentProfile: true, artisanProfile: true } },
          },
        },
      },
    });

    const unreadCounts = await getUnreadCounts(conversations.map((conversation) => conversation.id), currentUserId);

    return res.json({
      conversations: conversations.map((conversation) =>
        serializeConversation(conversation, currentUserId, unreadCounts[conversation.id] || 0)
      ),
    });
  } catch (error) {
    console.error('List conversations error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createConversation = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const currentRole = req.user.role;
    const participantId = await resolveParticipantId({
      currentUserId,
      currentRole,
      participantId: req.body.participantId,
      bookingId: req.body.bookingId,
    });

    if (!participantId) {
      return res.status(400).json({ error: 'Select a valid conversation participant' });
    }

    if (participantId === currentUserId) {
      return res.status(400).json({ error: 'You cannot message yourself' });
    }

    const participant = await db.user.findUnique({
      where: { id: participantId },
      include: { studentProfile: true, artisanProfile: true },
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const conversation = await createOrFetchConversation(currentUserId, participantId, req.body.bookingId || null);
    return res.status(201).json({ conversation: serializeConversation(conversation, currentUserId) });
  } catch (error) {
    if (error?.code === 'P2002') {
      const fallback = req.body.bookingId
        ? await db.conversation.findUnique({
          where: { bookingId: req.body.bookingId },
          include: {
            booking: true,
            user1: { include: { studentProfile: true, artisanProfile: true } },
            user2: { include: { studentProfile: true, artisanProfile: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { include: { studentProfile: true, artisanProfile: true } },
              },
            },
          },
        })
        : null;

      if (fallback) {
        return res.status(200).json({ conversation: serializeConversation(fallback, req.user.userId) });
      }
    }

    console.error('Create conversation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { conversation, isAllowed } = await getConversationAccess(req.params.id, currentUserId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { include: { studentProfile: true, artisanProfile: true } },
      },
    });

    const unreadCount = messages.filter((message) => message.senderId !== currentUserId && !message.isRead).length;

    return res.json({
      conversation: serializeConversation(conversation, currentUserId, unreadCount),
      messages: messages.map(serializeMessage),
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { conversation, isAllowed } = await getConversationAccess(req.params.id, currentUserId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = req.body.content?.trim();
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const recipientId = conversation.user1Id === currentUserId ? conversation.user2Id : conversation.user1Id;
    const sender = await db.user.findUnique({
      where: { id: currentUserId },
      include: { studentProfile: true, artisanProfile: true },
    });

    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: currentUserId,
        content,
      },
      include: {
        sender: { include: { studentProfile: true, artisanProfile: true } },
      },
    });

    const updatedConversation = await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
      include: {
        booking: true,
        user1: { include: { studentProfile: true, artisanProfile: true } },
        user2: { include: { studentProfile: true, artisanProfile: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { include: { studentProfile: true, artisanProfile: true } },
          },
        },
      },
    });

    db.notification.create({
      data: {
        userId: recipientId,
        title: 'New message',
        body: `${sender ? getDisplayName(sender) : 'Someone'}: ${content.slice(0, 80)}`,
        type: 'MESSAGE',
        metadata: {
          conversationId: conversation.id,
          messageId: message.id,
          senderId: currentUserId,
        },
      },
    }).catch((error) => {
      console.error('New message notification failed:', error);
    });

    const payload = {
      conversationId: conversation.id,
      message: serializeMessage(message),
      conversation: serializeConversation(updatedConversation, currentUserId),
    };

    emitConversationEvent(req, 'message:new', updatedConversation, payload);

    return res.status(201).json(payload);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const finalizeNegotiation = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { conversation, isAllowed } = await getConversationAccess(req.params.id, currentUserId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!conversation.bookingId) {
      return res.status(400).json({ error: 'This conversation is not linked to a booking' });
    }

    const booking = await db.booking.findUnique({
      where: { id: conversation.bookingId },
      include: {
        student: { include: { studentProfile: true } },
        artisan: { include: { user: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isStudentOwner = booking.studentId === currentUserId;
    const isArtisanOwner = booking.artisan.userId === currentUserId;

    if (!isStudentOwner && !isArtisanOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['PENDING', 'ACCEPTED'].includes(booking.status)) {
      return res.status(400).json({ error: 'Negotiation can only be finalized for pending or accepted bookings' });
    }

    const agreedPrice = Number(req.body.agreedPrice ?? booking.agreedPrice);
    if (!Number.isFinite(agreedPrice) || agreedPrice <= 0) {
      return res.status(400).json({ error: 'Provide a valid agreed price' });
    }

    const actor = isStudentOwner ? 'student' : 'artisan';
    const actorName = isStudentOwner
      ? `${booking.student.studentProfile?.firstName || ''} ${booking.student.studentProfile?.lastName || ''}`.trim() || booking.student.email
      : `${booking.artisan.firstName || ''} ${booking.artisan.lastName || ''}`.trim() || booking.artisan.user.email;
    const recipientUserId = isStudentOwner ? booking.artisan.userId : booking.studentId;

    const pendingProposal = await getPendingFinalizationProposal(booking);
    const pendingMetadata = pendingProposal?.metadata || null;
    const hasPendingFromOther = pendingMetadata && pendingMetadata.by && pendingMetadata.by !== actor;
    const matchesPendingPrice = Number(pendingMetadata?.proposedPrice) === agreedPrice;

    const sender = await db.user.findUnique({
      where: { id: currentUserId },
      include: { studentProfile: true, artisanProfile: true },
    });

    if (!hasPendingFromOther || !matchesPendingPrice) {
      const proposalMessage = await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: currentUserId,
          content: `${actorName} proposed NGN ${Number(agreedPrice).toLocaleString()} as the final price. Waiting for confirmation.`,
        },
        include: {
          sender: { include: { studentProfile: true, artisanProfile: true } },
        },
      });

      const updatedConversation = await db.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
        include: {
          booking: true,
          user1: { include: { studentProfile: true, artisanProfile: true } },
          user2: { include: { studentProfile: true, artisanProfile: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: { include: { studentProfile: true, artisanProfile: true } },
            },
          },
        },
      });

      db.notification.create({
        data: {
          userId: recipientUserId,
          title: 'Final price proposal',
          body: `${actorName} proposed NGN ${Number(agreedPrice).toLocaleString()} for ${booking.title}.`,
          type: FINALIZATION_NOTIFICATION_TYPE,
          metadata: {
            bookingId: booking.id,
            conversationId: conversation.id,
            by: actor,
            proposedPrice: agreedPrice,
            state: 'PENDING',
          },
        },
      }).catch((error) => {
        console.error('Pending finalization notification failed:', error);
      });

      const pendingPayload = {
        conversationId: conversation.id,
        pendingConfirmation: true,
        message: serializeMessage(proposalMessage),
        conversation: serializeConversation(updatedConversation, currentUserId),
        booking: {
          id: booking.id,
          status: booking.status,
          agreedPrice: booking.agreedPrice,
          proposedPrice: agreedPrice,
        },
      };

      emitConversationEvent(req, 'message:new', updatedConversation, pendingPayload);
      return res.status(202).json(pendingPayload);
    }

    const updatedBooking = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: 'ACCEPTED',
        agreedPrice,
        rejectionReason: null,
      },
      include: {
        student: { include: { studentProfile: true } },
        artisan: { include: { user: true } },
      },
    });

    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: currentUserId,
        content: `Negotiation finalized at NGN ${Number(agreedPrice).toLocaleString()}.`,
      },
      include: {
        sender: { include: { studentProfile: true, artisanProfile: true } },
      },
    });

    const updatedConversation = await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
      include: {
        booking: true,
        user1: { include: { studentProfile: true, artisanProfile: true } },
        user2: { include: { studentProfile: true, artisanProfile: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { include: { studentProfile: true, artisanProfile: true } },
          },
        },
      },
    });

    db.notification.createMany({
      data: [
        {
          userId: booking.studentId,
          title: 'Negotiation finalized',
          body: `${sender ? getDisplayName(sender) : 'A participant'} finalized ${booking.title} at NGN ${Number(agreedPrice).toLocaleString()}.`,
          type: 'BOOKING_STATUS',
          metadata: { bookingId: booking.id, conversationId: conversation.id, agreedPrice },
        },
        {
          userId: booking.artisan.userId,
          title: 'Negotiation finalized',
          body: `${sender ? getDisplayName(sender) : 'A participant'} finalized ${booking.title} at NGN ${Number(agreedPrice).toLocaleString()}.`,
          type: 'BOOKING_STATUS',
          metadata: { bookingId: booking.id, conversationId: conversation.id, agreedPrice },
        },
      ],
    }).catch((error) => {
      console.error('Finalize negotiation notifications failed:', error);
    });

    sendEmail({
      to: booking.student.email,
      subject: `Negotiation finalized for ${booking.title}`,
      html: `<p>Your booking for <strong>${booking.title}</strong> was finalized at <strong>NGN ${Number(agreedPrice).toLocaleString()}</strong>.</p>`,
    }).catch((emailError) => {
      console.error('Finalize negotiation student email failed:', emailError);
    });

    sendEmail({
      to: booking.artisan.user.email,
      subject: `Negotiation finalized for ${booking.title}`,
      html: `<p>Your booking for <strong>${booking.title}</strong> was finalized at <strong>NGN ${Number(agreedPrice).toLocaleString()}</strong>.</p>`,
    }).catch((emailError) => {
      console.error('Finalize negotiation artisan email failed:', emailError);
    });

    const payload = {
      conversationId: conversation.id,
      message: serializeMessage(message),
      conversation: serializeConversation(updatedConversation, currentUserId),
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        agreedPrice: updatedBooking.agreedPrice,
      },
    };

    emitConversationEvent(req, 'message:new', updatedConversation, payload);

    return res.json(payload);
  } catch (error) {
    console.error('Finalize negotiation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { conversation, isAllowed } = await getConversationAccess(req.params.id, currentUserId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark conversation read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};