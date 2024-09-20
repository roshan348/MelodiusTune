import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
})
export class PlayerComponent implements OnInit {
  albums: any[] = [];
  songs: any[] = [];
  currentSong: any = null;
  audio: HTMLAudioElement;
  volume: number = 100;
  isMuted: boolean = false;
  currentTime: string = '00:00';
  duration: string = '00:00';
  currentIndex: number = 0;
  i!: number;
  previousVolume: number = 1;
  isMenuOpen: boolean = false;

  constructor(private supabaseService: SupabaseService) {
    this.audio = new Audio();

    // Update the current time and duration
    this.audio.ontimeupdate = () => {
      this.updateTime();
    };

    this.audio.onloadedmetadata = () => {
      this.duration = this.formatTime(this.audio.duration);
    };
  }

  ngOnInit() {
    this.getAlbums();
    this.onAlbumClick(1); // Load default album (album_id 1) on page load
    this.volume = 100;
    this.isMuted = false;
  }

  openMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    console.log('Clicked');
  }

  // Close the menu
  // closeMenu() {
  //   this.isMenuOpen = false;
  // }

  async getAlbums() {
    const { data } = await this.supabaseService.getAlbums();
    if (data) {
      this.albums = data;
    }
  }

  async onAlbumClick(id: number) {
    const { data } = await this.supabaseService.getSongs(id);
    if (data && data.length > 0) {
      this.songs = [];
      data.forEach((song: any) => {
        const mp3Urls = song.mp3_url;
        mp3Urls.forEach((url: string) => {
          this.songs.push({
            url: url,
            title: this.extractTitleFromUrl(url),
            artist: song.artist || 'Unknown Artist',
          });
        });
      });

      // Play the first song by default
      if (this.songs.length > 0) {
        this.playSong(this.songs[0], 0);
      }
    }
  }

  extractTitleFromUrl(url: string): string {
    try {
      // Extract the filename from the URL
      const segments = url.split('/');
      let filename = segments[segments.length - 1];

      // Remove any query strings or URL fragments (like ?id=123 or #section)
      filename = filename.split('?')[0].split('#')[0];

      // Replace underscores or dashes with spaces for readability
      let title = filename.replace(/[_-]/g, ' ');

      // Decode URL-encoded characters (e.g., %20 -> space)
      title = decodeURIComponent(title);

      // Capitalize the first letter of each word for better appearance
      title = title
        .toLowerCase()
        .replace(/\b\w/g, (char: string) => char.toUpperCase());

      // Return the title with the .mp3 extension
      return title;
    } catch (error) {
      console.error('Error extracting title from URL:', error);
      return 'Unknown Title'; // Return a default title in case of an error
    }
  }

  playSong(song: any, index: number) {
    if (this.audio) {
      this.audio.pause();
    }

    this.currentSong = song;
    this.currentIndex = index;

    this.audio = new Audio(song.url);
    this.audio.volume = this.volume / 100;

    this.audio.onloadedmetadata = () => {
      this.duration = this.formatTime(this.audio.duration);
      this.audio.play();
    };

    this.audio.ontimeupdate = () => {
      this.currentTime = this.formatTime(this.audio.currentTime);
    };
  }

  setVolume(event: any) {
    this.volume = event.target.value; // Set volume based on range input
    if (!this.isMuted) {
      this.currentSong.volume = this.volume / 100; // Update song volume if not muted
    }
  }

  toggleMute(volumeIcon: HTMLImageElement) {
    if (this.isMuted) {
      this.isMuted = false;
      volumeIcon.src = volumeIcon.src.replace('volume.svg', 'mute.svg');
      this.currentSong.volume = this.volume / 100;
    } else {
      this.isMuted = true;
      volumeIcon.src = volumeIcon.src.replace('mute.svg', 'volume.svg');
      this.currentSong.volume = 0;
    }
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds)) {
      return '00:00'; // Return default value if time is NaN
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${
      remainingSeconds < 10 ? '0' : ''
    }${remainingSeconds}`;
  }

  nextSong() {
    // Check if the current index is not the last song in the array
    if (this.currentIndex < this.songs.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Go back to the first song if it's the last one
    }
    this.playSong(this.songs[this.currentIndex], this.currentIndex);
  }

  previousSong() {
    // Check if the current index is not the first song in the array
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.songs.length - 1; // Go to the last song if it's the first one
    }
    this.playSong(this.songs[this.currentIndex], this.currentIndex);
  }

  togglePlayPause() {
    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  seek(event: any) {
    const seekbar = event.target;
    const rect = seekbar.getBoundingClientRect();
    const seekPosition = (event.clientX - rect.left) / rect.width;
    this.audio.currentTime = seekPosition * this.audio.duration;
  }

  updateTime() {
    this.currentTime = this.formatTime(this.audio.currentTime);
  }
}
