import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
})
export class PlayerComponent implements OnInit {
  albums: any;
  songs: any = [];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.getAlbums();
  }

  getAlbums() {
    this.supabaseService.getAlbums().then((res) => {
      console.log('albums', res);
      this.albums = res.data;
    });
  }

  onAlbumClick(albumId: string) {
    this.supabaseService.getSongs(albumId).then((res) => {
      console.log('songs', res);
      this.songs = (res.data ?? []).map((song: any) => {
        const title = this.extractTitleFromUrl(song.mp3_url);
        return { ...song, title };
      });
    });
  }

  extractTitleFromUrl(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace('.mp3', '').replace(/-/g, ' ').toUpperCase();
  }
}
