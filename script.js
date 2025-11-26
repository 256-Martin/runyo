


// YouTube API Configuration
const YOUTUBE_API_KEY = 'AIzaSyCshf5QauGva3cQjpV9bLdSHZb-IHy7SjI';
const CHANNEL_ID = 'UClkK6-wjQGAh4TFtmMI7wgA';
let youtubePlayer;

// YouTube API Integration
async function fetchPopularVideos() {
    try {
        // First, get the uploads playlist ID from the channel
        const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
        const channelData = await channelResponse.json();
        
        if (!channelData.items || channelData.items.length === 0) {
            throw new Error('Channel not found');
        }
        
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
        
        // Get videos from the uploads playlist
        const playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}&key=${YOUTUBE_API_KEY}`);
        const playlistData = await playlistResponse.json();
        
        if (!playlistData.items || playlistData.items.length === 0) {
            throw new Error('No videos found in channel');
        }
        
        // Get video IDs for statistics
        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId);
        
        // Get video statistics (view counts)
        const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`);
        const statsData = await statsResponse.json();
        
        // Sort videos by view count (descending) and take top 6
        const popularVideos = statsData.items
            .sort((a, b) => b.statistics.viewCount - a.statistics.viewCount)
            .slice(0, 6);
        
        displayYouTubeVideos(popularVideos);
        window.youtubeVideosLoaded = true;
        
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        document.getElementById('youtube-videos-container').innerHTML = `
            <div class="error-message" style="text-align: center; padding: 2rem; color: var(--secondary);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Unable to load videos from YouTube. Please try again later.</p>
            </div>
        `;
    }
}

function displayYouTubeVideos(videos) {
    const container = document.getElementById('youtube-videos-container');
    
    if (!videos || videos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray);">No videos found.</p>';
        return;
    }
    
    const videosHTML = videos.map(video => `
        <div class="youtube-video-card">
            <img src="${video.snippet.thumbnails.medium.url}" 
                 class="youtube-video-thumb" 
                 alt="${video.snippet.title}"
                 onclick="openYouTubeVideo('${video.id}')">
            <div class="youtube-video-info">
                <h3 class="youtube-video-title">${video.snippet.title}</h3>
                <p class="youtube-video-views">${formatViewCount(video.statistics.viewCount)} views</p>
                <button class="action-btn" onclick="openYouTubeVideo('${video.id}')">
                    <i class="fab fa-youtube"></i> Watch Now
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = videosHTML;
}

function formatViewCount(viewCount) {
    const count = parseInt(viewCount);
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
}

function openYouTubeVideo(videoId) {
    const modal = document.getElementById('youtube-modal');
    const playerContainer = document.getElementById('youtube-player');
    
    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = function() {
            createYouTubePlayer(videoId);
        };
    } else {
        createYouTubePlayer(videoId);
    }
    
    modal.style.display = 'flex';
}

function createYouTubePlayer(videoId) {
    if (youtubePlayer) {
        youtubePlayer.loadVideoById(videoId);
    } else {
        youtubePlayer = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'playsinline': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
}

function onPlayerReady(event) {
    // Player is ready
}

function onPlayerStateChange(event) {
    // Handle player state changes
}

function closeYouTubeModal() {
    const modal = document.getElementById('youtube-modal');
    modal.style.display = 'none';
    
    if (youtubePlayer) {
        youtubePlayer.stopVideo();
    }
}

// Close modal when clicking outside the content
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('youtube-modal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                closeYouTubeModal();
            }
        });
    }
    
    // Simple animation for page elements
    const animatedElements = document.querySelectorAll('.music-card, .video-card');
    
    animatedElements.forEach((element, index) => {
        element.style.animation = `fadeIn 0.5s ease ${index * 0.2}s forwards`;
        element.style.opacity = 0;
    });

    // Load YouTube videos on initial home page load
    if (document.getElementById('youtube-videos-container')) {
        fetchPopularVideos();
    }
    
    // Form submissions
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Message sent successfully! We will get back to you soon.');
            this.reset();
        });
    }
});
