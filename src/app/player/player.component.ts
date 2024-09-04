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
  albums: any;
  songs: any = [];
  audio: HTMLAudioElement = new Audio();
  currentSongTitle: string = '';
  currentSongArtist: string = '';
  currentTime: number = 0;
  volume: number = 100;
  isPlaying: boolean = false;
  currentSongIndex: number = 0;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.getAlbums();
    this.loadDefaultSongs();
    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
    });
  }

  getAlbums() {
    this.supabaseService.getAlbums().then((res) => {
      console.log('albums', res);
      this.albums = res.data;
    });
  }

  loadDefaultSongs() {
    const defaultAlbumId = '1'; // Default album ID
    this.onAlbumClick(defaultAlbumId); // Fetch songs for the default album ID
  }

  onAlbumClick(albumId: string) {
    this.supabaseService.getSongs(albumId).then((res) => {
      console.log('Fetched songs', res);
      if (res.data && res.data.length > 0) {
        this.songs = res.data.map((song: any) => {
          const title = this.extractTitleFromUrl(song.mp3_url); // Generate title from mp3_url
          return { ...song, title }; // Return song with title
        });
        this.playSong(0);
      } else {
        this.songs = []; // No songs found for this album
      }
    });
  }

  playSong(song: any) {
    if (song) {
      this.audio.src = song.mp3_url;
      this.audio.play();
      this.currentSongTitle = song.title;
      this.currentSongArtist = song.artist || 'Unknown Artist';
      this.isPlaying = true;
      this.currentSongIndex = this.songs.indexOf(song);
      this.updatePlayBar();
    }
  }

  updatePlayBar() {
    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
    });
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
    this.isPlaying = !this.isPlaying;
  }

  playPrevious() {
    const previousIndex =
      (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
    this.playSong(previousIndex);
  }

  playNext() {
    const nextIndex = (this.currentSongIndex + 1) % this.songs.length;
    this.playSong(nextIndex);
  }

  setVolume(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const volumeValue = parseInt(inputElement.value, 10);
    this.audio.volume = volumeValue / 100;
    this.volume = volumeValue;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  extractTitleFromUrl(mp3Url: string): string {
    console.log('Extracting title from URL:', mp3Url);
    if (!mp3Url) {
      return 'Unknown Title';
    }

    // Split the URL by '/' and get the last part
    const urlParts = mp3Url.split('/');
    const fileWithQuery = urlParts[urlParts.length - 1];

    // Remove the query string part (everything after '?')
    const fileName = fileWithQuery.split('?')[0];

    // Decode the URL encoding (e.g., '%20' to space) and remove '.mp3'
    const title = decodeURIComponent(fileName).replace('', '');

    console.log('Extracted title:', title);
    return title;
  }
}
