# Messaging System Features Update

## ✅ Completed Features

### 1. Profile Picture Upload (COMPLETE)
- ✅ Added camera button overlay on profile picture in ProfileModal
- ✅ Click to select image file
- ✅ Preview selected image before upload
- ✅ Upload/Cancel buttons appear with preview
- ✅ Uploads to Firebase Storage
- ✅ Updates Firestore profile automatically
- ✅ Shows loading state during upload
- ✅ Error handling with user-friendly messages

**Files Modified:**
- `/src/components/Landing/ProfileModal.jsx` - Added upload UI and handlers

**How It Works:**
1. Click camera icon on profile picture
2. Select image from device
3. Preview appears with Upload/Cancel buttons
4. Click Upload to save
5. Profile picture updates across entire app

## 🚧 Features In Progress

### 2. Profile Picture Rendering Fix
**Status:** Ready for implementation

**Issue:** Profile pictures not updating in real-time across components

**Solution:** 
- Use Firestore profile data instead of Auth photoURL
- Subscribe to user profile updates in useUserProfile hook
- Pass updated photoURL to Avatar components

### 3. Image Upload in Direct Messages
**Status:** Service created, UI pending

**Created:**
- `/src/services/messageAttachments.js` - Image upload service

**Needed:**
- Update `DirectMessagingPanel.jsx` with:
  - 📎 Paperclip button for file selection
  - Drag & drop zone for images
  - Image preview before sending
  - Image rendering in message bubbles
  - Click to view full-size image

### 4. GIF Picker Integration
**Status:** Planned

**Implementation Plan:**
1. Create `/src/components/Messaging/GifPicker.jsx`
2. Use Giphy API (free tier: 42 requests/hour)
3. Add GIF button next to paperclip
4. Search interface for GIFs
5. Send GIF URL as message attachment

**Giphy API Setup:**
```javascript
// Free API Key (Demo): dc6zaTOxFJmzC
// Search: https://api.giphy.com/v1/gifs/search?api_key=KEY&q=SEARCH&limit=20
// Trending: https://api.giphy.com/v1/gifs/trending?api_key=KEY&limit=20
```

### 5. Remove Friend Button
**Status:** Planned

**Implementation:** 
- Add "Remove Friend" button to profile popups
- Add to:
  - ChatPanel profile popup
  - DirectMessagingPanel header
  - LeaderboardModal profile popup
- Confirmation dialog before removal
- Updates friends list in real-time

### 6. Message Deletion
**Status:** Planned

**Implementation:**
- Long-press or hover to show delete option
- Only own messages deletable
- Confirmation dialog
- Remove from RTDB
- Show "Message deleted" placeholder

### 7. Online Status Indicators
**Status:** Planned

**Implementation:**
- Green dot overlay on avatar for online friends
- Use Firebase Realtime Database presence
- Track online/offline/away states
- Update in:
  - Friends list (MessagingButton)
  - Direct message header
  - Leaderboard

### 8. Share Canvas with Friend
**Status:** Planned

**Implementation:**
- Add "Share Canvas" button in friend profile popup
- Select canvas from dropdown
- Choose permission (view/edit)
- Send notification to friend
- Auto-adds to their shared canvases

## Implementation Priority

### Phase 1: Core Functionality (Complete This Session)
1. ✅ Profile picture upload
2. 🔄 Fix profile picture rendering
3. 🔄 Image upload in messages
4. 🔄 GIF picker

### Phase 2: Social Features (Next Session)
5. Remove friend button
6. Message deletion
7. Online status indicators

### Phase 3: Collaboration (Future)
8. Share canvas with friend

## Technical Details

### Database Structure Updates

```javascript
// Message with image attachment
/directMessages/{conversationId}/messages/{messageId}
{
  text: string,
  from: string,
  fromName: string,
  fromPhoto: string|null,
  timestamp: number,
  attachment: {
    type: 'image' | 'gif',
    url: string,
    width: number,  // optional
    height: number  // optional
  }
}

// Online presence
/presence/{userId}
{
  status: 'online' | 'offline' | 'away',
  lastSeen: timestamp
}
```

### Firebase Storage Structure

```
/message-images/
  {conversationId}/
    {timestamp}.jpg
    {timestamp}.png

/profile-pictures/
  {userId}/
    {timestamp}.jpg
```

## Next Steps

1. **Immediate:** Complete profile picture rendering fix
2. **Today:** Add image upload UI to DirectMessagingPanel
3. **Today:** Implement GIF picker component
4. **Tomorrow:** Add social features (remove friend, message delete)
5. **Later:** Add presence system and canvas sharing

## User Experience Notes

### Image Upload Flow
1. User clicks paperclip icon OR drags image
2. Image preview appears above input
3. User can add text message with image
4. Click Send to upload and send
5. Shows upload progress
6. Image appears in chat with thumbnail
7. Click thumbnail to view full size

### GIF Flow
1. User clicks GIF button (next to paperclip)
2. GIF picker modal opens
3. Shows trending GIFs or search
4. Click GIF to select
5. GIF preview appears above input
6. Click Send to send GIF
7. GIF auto-plays in chat (small loop)

### Remove Friend Flow
1. User opens friend's profile
2. Clicks "..." menu or "Remove Friend" button
3. Confirmation: "Remove [Name] from friends?"
4. Confirms removal
5. Friend removed from both sides
6. Conversation remains (can't message anymore)
7. Toast: "Removed from friends"

## Files to Create

1. `/src/components/Messaging/GifPicker.jsx` - GIF search/selection UI
2. `/src/components/Messaging/ImagePreview.jsx` - Image preview before send
3. `/src/components/Messaging/FullImageViewer.jsx` - Click to view full size
4. `/src/services/messageAttachments.js` - ✅ Created
5. `/src/services/presence.js` - ⚠️ Already exists, needs enhancement
6. `/src/hooks/useOnlineStatus.js` - Track friend online status

## Files to Modify

1. ✅ `/src/components/Landing/ProfileModal.jsx` - Profile picture upload
2. `/src/components/Landing/DirectMessagingPanel.jsx` - Images, GIFs, delete
3. `/src/components/Landing/MessagingButton.jsx` - Online status dots
4. `/src/components/Canvas/ChatPanel.jsx` - Profile picture from Firestore
5. `/src/services/friends.js` - Add removeFriend function (already exists!)
6. `/src/services/directMessages.js` - Support attachments, delete messages

## Testing Checklist

- [ ] Upload profile picture (JPG, PNG, GIF)
- [ ] Profile picture shows immediately after upload
- [ ] Profile picture syncs across all components
- [ ] Send image in direct message
- [ ] Drag & drop image to send
- [ ] Search and send GIF
- [ ] Trending GIFs load
- [ ] Click image to view full size
- [ ] Delete own message
- [ ] Can't delete other user's message
- [ ] Remove friend
- [ ] Friend removed on both sides
- [ ] Can't message removed friend
- [ ] Online status shows green dot
- [ ] Offline friends show no dot
- [ ] Share canvas with friend
- [ ] Friend receives share notification

## Current Status Summary

**Completed:**
- ✅ Profile picture upload in ProfileModal
- ✅ Image upload service created

**Next Up:**
1. Fix profile picture rendering (use Firestore data)
2. Add image upload UI to DirectMessagingPanel
3. Create and integrate GIF picker

**Estimated Completion:**
- Phase 1: End of current session (2-3 hours)
- Phase 2: Next session (1-2 hours)
- Phase 3: Future session (1 hour)


