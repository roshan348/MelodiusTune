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

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    this.supabaseService.getAlbums().then((res) => {
      this.albums = res.data?.length;
    });
  }
}
