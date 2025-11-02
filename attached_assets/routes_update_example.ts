// Example updates for your routes.ts file

import { generateVideo, checkVideoStatus } from './veo';

// When generating a video:
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, imagePath } = req.body;
    
    // Generate the video
    const result = await generateVideo({
      prompt,
      imagePath,
      // other config options
    });
    
    // Extract the operation ID from the result
    const operationId = result.operationId || result.operation.name?.split('/').pop() || `op_${Date.now()}`;
    
    // Store this operation ID in your database associated with the user/request
    // For example:
    await saveVideoRequest({
      userId: req.user.id,
      operationId: operationId,
      status: 'processing',
      createdAt: new Date(),
    });
    
    // Return the operation ID to the client
    res.json({
      success: true,
      operationId: operationId,
      message: 'Video generation started',
    });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate video',
    });
  }
});

// When checking video status:
app.get('/api/video-status/:id', async (req, res) => {
  try {
    const { id } = req.params; // This could be your internal ID
    
    // Get the operation ID from your database
    const videoRequest = await getVideoRequest(id);
    if (!videoRequest) {
      return res.status(404).json({ error: 'Video request not found' });
    }
    
    // Pass just the operation ID (not the full path)
    const status = await checkVideoStatus(videoRequest.operationId);
    
    // Update the database with the new status
    if (status.status === 'completed' || status.status === 'failed') {
      await updateVideoRequest(id, {
        status: status.status,
        videoUrl: status.videoUrl,
        error: status.error,
        completedAt: new Date(),
      });
    }
    
    // Return the status to the client
    res.json(status);
  } catch (error) {
    console.error('Error checking video status:', error);
    res.status(500).json({
      status: 'failed',
      error: error.message || 'Failed to check video status',
    });
  }
});

// Optional: Add a cleanup endpoint to clear old operations from cache
app.post('/api/admin/clear-operations-cache', async (req, res) => {
  try {
    const { clearOldOperations } = require('./veo');
    clearOldOperations();
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});