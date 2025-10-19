/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Direct Messages Service - Friend-to-Friend Messaging
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles direct messaging between friends.
 * Messages are stored in conversations identified by sorted user IDs.
 * 
 * Database Structure:
 * /directMessages/{conversationId}/messages/{messageId}
 * /directMessages/{conversationId}/participants/{userId}
 * /directMessages/{conversationId}/lastMessage - For sorting
 */

import { ref, push, onValue, query, limitToLast, orderByKey, set, get, remove, update } from 'firebase/database';
import { rtdb } from './firebase';

/**
 * Get conversation ID for two users (sorted alphabetically for consistency)
 */
export const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Send a direct message to a friend (with optional attachment and reply)
 */
export const sendDirectMessage = async (fromUser, toUserId, messageText, attachment = null, replyTo = null) => {
  try {
    const conversationId = getConversationId(fromUser.uid, toUserId);
    const timestamp = Date.now();
    
    const messagesRef = ref(rtdb, `directMessages/${conversationId}/messages`);
    
    const messageData = {
      text: messageText.trim(),
      from: fromUser.uid,
      fromName: fromUser.displayName || fromUser.email?.split('@')[0] || 'User',
      fromPhoto: fromUser.photoURL || null,
      timestamp: timestamp
    };

    // Add attachment if provided
    if (attachment) {
      messageData.attachment = attachment;
    }

    // Add reply reference if provided
    if (replyTo) {
      messageData.replyTo = replyTo;
    }
    
    await push(messagesRef, messageData);
    
    // Update last message for conversation sorting
    const lastMessageText = attachment?.type === 'image' ? '📷 Image' : 
                           attachment?.type === 'gif' ? '🎬 GIF' : 
                           messageText.trim();
    
    await set(ref(rtdb, `directMessages/${conversationId}/lastMessage`), {
      text: lastMessageText,
      from: fromUser.uid,
      timestamp: timestamp
    });
    
    // Ensure both participants are recorded
    await set(ref(rtdb, `directMessages/${conversationId}/participants/${fromUser.uid}`), true);
    await set(ref(rtdb, `directMessages/${conversationId}/participants/${toUserId}`), true);
    
    console.log('[DirectMessages] Message sent:', conversationId);
  } catch (error) {
    console.error('[DirectMessages] Failed to send message:', error);
    throw error;
  }
};

/**
 * Delete a message (only by sender)
 */
export const deleteDirectMessage = async (userId1, userId2, messageId, messageSenderId) => {
  try {
    const conversationId = getConversationId(userId1, userId2);
    
    // Only allow deleting own messages
    if (userId1 !== messageSenderId && userId2 !== messageSenderId) {
      throw new Error('You can only delete your own messages');
    }
    
    await remove(ref(rtdb, `directMessages/${conversationId}/messages/${messageId}`));
    
    console.log('[DirectMessages] Message deleted:', messageId);
  } catch (error) {
    console.error('[DirectMessages] Failed to delete message:', error);
    throw error;
  }
};

/**
 * Edit a message (only by sender)
 */
export const editDirectMessage = async (userId1, userId2, messageId, messageSenderId, newText) => {
  try {
    const conversationId = getConversationId(userId1, userId2);
    
    // Only allow editing own messages
    if (userId1 !== messageSenderId && userId2 !== messageSenderId) {
      throw new Error('You can only edit your own messages');
    }
    
    const messageRef = ref(rtdb, `directMessages/${conversationId}/messages/${messageId}`);
    await update(messageRef, {
      text: newText.trim(),
      edited: true,
      editedAt: Date.now()
    });
    
    console.log('[DirectMessages] Message edited:', messageId);
  } catch (error) {
    console.error('[DirectMessages] Failed to edit message:', error);
    throw error;
  }
};

/**
 * Subscribe to messages in a conversation
 */
export const subscribeToConversation = (userId1, userId2, callback) => {
  const conversationId = getConversationId(userId1, userId2);
  const messagesRef = ref(rtdb, `directMessages/${conversationId}/messages`);
  const messagesQuery = query(messagesRef, orderByKey(), limitToLast(100));
  
  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const messages = Object.entries(data).map(([id, msg]) => ({
        id,
        ...msg
      }));
      callback(messages);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

/**
 * Get all conversations for a user (with their friends)
 */
export const getUserConversations = async (userId, friendIds) => {
  try {
    const conversations = [];
    
    for (const friendId of friendIds) {
      const conversationId = getConversationId(userId, friendId);
      const lastMessageRef = ref(rtdb, `directMessages/${conversationId}/lastMessage`);
      const snapshot = await get(lastMessageRef);
      
      if (snapshot.exists()) {
        conversations.push({
          conversationId,
          friendId,
          lastMessage: snapshot.val()
        });
      } else {
        // No messages yet, but conversation exists (friend added)
        conversations.push({
          conversationId,
          friendId,
          lastMessage: null
        });
      }
    }
    
    // Sort by most recent message
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });
    
    return conversations;
  } catch (error) {
    console.error('[DirectMessages] Failed to get conversations:', error);
    return [];
  }
};

/**
 * Subscribe to all conversations for a user
 */
export const subscribeToAllConversations = (userId, friendIds, callback) => {
  if (!friendIds || friendIds.length === 0) {
    callback([]);
    return () => {};
  }
  
  const unsubscribers = [];
  const conversationsData = {};
  
  const updateCallback = () => {
    const conversations = Object.values(conversationsData)
      .sort((a, b) => {
        const timeA = a.lastMessage?.timestamp || 0;
        const timeB = b.lastMessage?.timestamp || 0;
        return timeB - timeA;
      });
    callback(conversations);
  };
  
  friendIds.forEach(friendId => {
    const conversationId = getConversationId(userId, friendId);
    const lastMessageRef = ref(rtdb, `directMessages/${conversationId}/lastMessage`);
    
    const unsubscribe = onValue(lastMessageRef, (snapshot) => {
      conversationsData[conversationId] = {
        conversationId,
        friendId,
        lastMessage: snapshot.exists() ? snapshot.val() : null
      };
      updateCallback();
    });
    
    unsubscribers.push(unsubscribe);
  });
  
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

