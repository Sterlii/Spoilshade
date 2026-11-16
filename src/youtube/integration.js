(() => {
  'use strict';
  const S=globalThis.Spoilshade ||= {};
  const CARDS='ytd-rich-grid-media,ytd-video-renderer,ytd-compact-video-renderer,ytd-grid-video-renderer,yt-lockup-view-model,ytd-reel-item-renderer,ytm-shorts-lockup-view-model,ytd-playlist-video-renderer';
  const TITLES='#video-title,.yt-lockup-metadata-view-model__title,.shortsLockupViewModelHostMetadataTitle,.ytShortsVideoTitleViewModelShortsVideoTitle,h3 a';
  const THUMBNAILS='ytd-thumbnail,a#thumbnail,yt-thumbnail-view-model,.yt-lockup-view-model__content-image,.shortsLockupViewModelHostThumbnailContainer,a[href^="/shorts/"]';
  S.createYouTubeIntegration=({document:doc=globalThis.document,store=S.createSettingsStore()}={})=>{
    const win=doc.defaultView;
    const records=new Map(), reveals=new Map(), queue=new Set();
    let settings=null, match=()=>false, observer, unsubscribe, scheduled=false, running=false, revision=0;
    let processed=0;
    function identity(card,title) {
      const href=title?.closest('a')?.href || title?.querySelector('a')?.href || card.querySelector('a[href*="/watch?"],a[href*="/shorts/"]')?.href;
      if(!href) return null;
      try {
        const url=new URL(href,doc.baseURI);
        return url.searchParams.get('v') || url.pathname.match(/^\/shorts\/([^/]+)/)?.[1] || null;
      } catch {return null;}
    }
    function process(card) {
      if(!card.isConnected) return;
      const previous=records.get(card);
      // A modern lockup may be nested in a legacy wrapper. Retire any old wrapper ownership first.
      if(card.querySelector(CARDS)) {
        previous?.redaction?.destroy();records.delete(card);
        card.setAttribute('data-ss-ready','');return;
      }
      const title=card.querySelector(TITLES), thumbnail=card.querySelector(THUMBNAILS);
      const text=title?.textContent.trim(), id=identity(card,title);
      if(!text || !id) {
        previous?.redaction?.destroy(); records.delete(card); card.removeAttribute('data-ss-ready'); return;
      }
      const blocked=settings.enabled && match(text);
      const signature=`${id}\n${text}\n${blocked}`;
      if(previous?.signature===signature && previous.title===title && previous.thumbnail===thumbnail) {
        previous.redaction?.refresh(); card.setAttribute('data-ss-ready',''); return;
      }
      previous?.redaction?.destroy();
      processed++;
      const record={signature,title,thumbnail,id,redaction:null};
      if(blocked) {
        let reveal=reveals.get(id);
        if(reveal?.text!==text) {
          reveals.delete(id);
          reveal={text,title:false,thumbnail:false};
        }
        record.redaction=S.createRedaction(card,title,thumbnail,reveal,(kind,value)=>{
          const current=reveals.get(id);
          const state={...(current?.text===text?current:{text,title:false,thumbnail:false}),[kind]:value};
          reveals.delete(id); reveals.set(id,state);
          if(reveals.size>1000) reveals.delete(reveals.keys().next().value);
        });
      }
      records.set(card,record);
      card.setAttribute('data-ss-ready','');
    }
    function enqueue(root) {
      if(!root || (root.nodeType!==1 && root.nodeType!==9)) return;
      const own=root.nodeType===1 && root.closest('[data-ss-ui]');
      if(own) return;
      if(root.nodeType===1) {
        const card=root.closest(CARDS); if(card) queue.add(card);
      }
      for(const card of root.querySelectorAll(CARDS)) queue.add(card);
      schedule();
    }
    function schedule() {
      if(scheduled || !running || !settings) return;
      scheduled=true; win.queueMicrotask(flush);
    }
    function flush() {
      scheduled=false;
      if(!running || !settings) return;
      for(const [card,record] of records) if(!card.isConnected) {record.redaction?.destroy(); records.delete(card);}
      const batch=[...queue]; queue.clear();
      for(const card of batch) process(card);
    }
    function apply(next) {
      revision++; settings=next; match=S.createMatcher(settings);
      if(settings.enabled) doc.documentElement?.removeAttribute('data-ss-disabled');
      else doc.documentElement?.setAttribute('data-ss-disabled','');
      enqueue(doc);
    }
    const navigate=()=>enqueue(doc);
    return {
      async start() {
        if(running) return; running=true;
        observer=new win.MutationObserver(mutations=>{
          for(const mutation of mutations) {
            const element=mutation.target.nodeType===1?mutation.target:mutation.target.parentElement;
            if(element?.closest('[data-ss-ui]')) continue;
            if(mutation.type==='attributes' && !['href','title','aria-label','alt'].includes(mutation.attributeName)) continue;
            if(mutation.type==='childList') {
              const changed=[...mutation.addedNodes,...mutation.removedNodes];
              // Added controls are ours; removed controls may be page reconciliation and need recovery.
              if(!mutation.removedNodes.length && changed.length && changed.every(node=>node.nodeType===1 && node.hasAttribute('data-ss-ui'))) continue;
              for(const node of mutation.addedNodes) enqueue(node);
            }
            const card=element?.closest(CARDS);
            if(card) {card.removeAttribute('data-ss-ready');queue.add(card);}
            schedule();
          }
        });
        observer.observe(doc,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['href','title','aria-label','alt']});
        doc.addEventListener('yt-navigate-finish',navigate);
        doc.addEventListener('yt-page-data-updated',navigate);
        unsubscribe=store.subscribe(next=>{if(running)apply(next);});
        const before=revision;
        try {
          const loaded=await store.load();
          if(running && before===revision) apply(loaded);
        } catch(error) {
          // Keep the preemptive card guards rather than expose spoilers on storage failure.
          console.warn('Spoilshade: settings unavailable; protection is awaiting storage.');
          throw error;
        }
      },
      rescan:navigate,
      stats:()=>({tracked:records.size,reveals:reveals.size,processed,queued:queue.size}),
      stop() {
        running=false; observer?.disconnect();unsubscribe?.();
        doc.removeEventListener('yt-navigate-finish',navigate);doc.removeEventListener('yt-page-data-updated',navigate);
        for(const [card,record] of records) {record.redaction?.destroy();card.removeAttribute('data-ss-ready');}
        records.clear();queue.clear();reveals.clear();doc.documentElement?.setAttribute('data-ss-disabled','');
      }
    };
  };
  if(globalThis.browser?.runtime?.id || globalThis.chrome?.runtime?.id) {
    const integration=S.createYouTubeIntegration();
    integration.start().catch(()=>{});
  }
})();
