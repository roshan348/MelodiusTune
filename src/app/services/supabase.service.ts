import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.supbaseUrl,
      environment.supabase.supabseKey
    );
  }

  async getAlbums() {
    return await this.supabase.from('albums').select('*');
  }
}
