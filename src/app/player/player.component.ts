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
  audio: HTMLAudioElement | null = null;
  volume: number = 100;
  isMuted: boolean = false;
  currentTime: string = '00:00';
  duration: string = '00:00';

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.getAlbums();
    this.onAlbumClick(1); // Load default album (album_id 1) on page load
  }

  async getAlbums() {
    const { data } = await this.supabaseService.getAlbums();
    if (data) {
      this.albums = data;
    }
  }

  async onAlbumClick(albumId: number) {
    const { data } = await this.supabaseService.getSongs(albumId);
    if (data && data.length > 0) {
      this.songs = data;
      this.playSong(this.songs[0]); // Automatically play the first song of the album
    }
  }

  playSong(song: any) {
    if (this.audio) {
      this.audio.pause();
    }

    this.currentSong = song;
    const mp3Url = this.extractTitleFromUrl(song.mp3_url);

    this.audio = new Audio(song.mp3_url);
    this.audio.volume = this.volume / 100;
    this.audio.play();

    this.audio.ontimeupdate = () => {
      this.currentTime = this.formatTime(this.audio!.currentTime);
      this.duration = this.formatTime(this.audio!.duration);
    };
  }

  extractTitleFromUrl(mp3Url: string): string {
    if (!mp3Url) return 'Unknown Title';
    const urlParts = mp3Url.split('/');
    const fileWithQuery = urlParts[urlParts.length - 1];
    const fileName = fileWithQuery.split('?')[0];
    return decodeURIComponent(fileName.replace('.mp3', ''));
  }

  setVolume(event: any) {
    this.volume = +event.target.value;
    if (this.audio) {
      this.audio.volume = this.volume / 50;
    }
  }

  toggleMute() {
    if (this.audio) {
      this.isMuted = !this.isMuted;
      this.audio.muted = this.isMuted;
      this.volume = this.isMuted ? 0 : 20; // Toggle between mute and full volume
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  nextSong() {
    const currentIndex = this.songs.findIndex((s) => s === this.currentSong);
    const nextIndex = (currentIndex + 1) % this.songs.length;
    this.playSong(this.songs[nextIndex]);
  }

  previousSong() {
    const currentIndex = this.songs.findIndex((s) => s === this.currentSong);
    const prevIndex =
      (currentIndex - 1 + this.songs.length) % this.songs.length;
    this.playSong(this.songs[prevIndex]);
  }

  seek(event: MouseEvent) {
    const seekbar = event.currentTarget as HTMLElement;
    const rect = seekbar.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const percentage = offsetX / rect.width;

    if (this.audio && this.audio.duration) {
      this.audio.currentTime = percentage * this.audio.duration;
    }
  }
}
