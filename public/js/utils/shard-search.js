/**
 * Shard-Aware Search
 * Searches across active window and archived shards
 */

(function() {
  'use strict';

  /**
   * Search active window (current million-node block)
   */
  async function searchActiveWindow(query) {
    try {
      const response = await fetch(`/api/nodes?q=${encodeURIComponent(query)}`, {
        headers: {
          'Accept': 'application/json; charset=utf-8',
          'Accept-Charset': 'utf-8'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.windowSample || [];
    } catch (error) {
      console.warn('[Shard Search] Active window search failed:', error);
      return [];
    }
  }

  /**
   * Search archived shards
   */
  async function searchShards(query) {
    try {
      // List all shards
      const listResponse = await fetch('/api/shard/list', {
        headers: {
          'Accept': 'application/json; charset=utf-8',
          'Accept-Charset': 'utf-8'
        }
      });
      
      if (!listResponse.ok) {
        return [];
      }
      
      const { shards } = await listResponse.json();
      if (!shards || shards.length === 0) {
        return [];
      }
      
      // Search each shard
      const results = [];
      const queryLower = query.toLowerCase();
      
      for (const shardInfo of shards) {
        try {
          const shardResponse = await fetch(`/api/shard/${shardInfo.id}`, {
            headers: {
              'Accept': 'application/json; charset=utf-8',
              'Accept-Charset': 'utf-8'
            }
          });
          
          if (!shardResponse.ok) continue;
          
          const { shard } = await shardResponse.json();
          if (!shard || !shard.nodes) continue;
          
          // Search nodes in this shard
          const shardResults = shard.nodes.filter(node => {
            if (!node) return false;
            const title = (node.title || '').toLowerCase();
            const description = (node.description || '').toLowerCase();
            const ref = (node.ref || '').toLowerCase();
            return title.includes(queryLower) || 
                   description.includes(queryLower) || 
                   ref.includes(queryLower);
          });
          
          if (shardResults.length > 0) {
            results.push({
              shardId: shardInfo.id,
              shardTimestamp: shardInfo.timestamp,
              nodes: shardResults
            });
          }
        } catch (shardError) {
          console.warn(`[Shard Search] Failed to search shard ${shardInfo.id}:`, shardError);
        }
      }
      
      return results;
    } catch (error) {
      console.warn('[Shard Search] Shard search failed:', error);
      return [];
    }
  }

  /**
   * Federated search: Active window + Archived shards
   */
  async function federatedSearch(query) {
    const SearchEncoder = window.SearchEncoder || {
      encodeSearchQuery: (q) => String(q || '').trim(),
      sanitizeSearchText: (t) => String(t || '').trim()
    };
    
    const encodedQuery = SearchEncoder.encodeSearchQuery(query);
    if (!encodedQuery) return { active: [], shards: [] };
    
    // Search both in parallel
    const [activeResults, shardResults] = await Promise.all([
      searchActiveWindow(encodedQuery),
      searchShards(encodedQuery)
    ]);
    
    return {
      active: activeResults,
      shards: shardResults,
      total: activeResults.length + shardResults.reduce((sum, s) => sum + s.nodes.length, 0)
    };
  }

  // Export to window
  window.ShardSearch = {
    searchActiveWindow,
    searchShards,
    federatedSearch
  };

  console.log('[Shard Search] Shard-aware search utilities loaded');
})();
