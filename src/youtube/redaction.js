(() => {
  'use strict';
  const S = globalThis.Spoilshade ||= {};
  S.createRedaction = (card, title, thumbnail, initial, onReveal) => {
    const doc = card.ownerDocument;
    const states = {...initial};
    const slots = new Map();
    const saved = new Map();
    const parents = new Map();
    let destroyed = false;
    const remember = (node, name) => {
      if (!saved.has(node)) saved.set(node, new Map());
      const attributes = saved.get(node);
      if (!attributes.has(name)) attributes.set(name, node.getAttribute(name));
    };
    const restore = (node, name, value) => {
      if (node.getAttribute(name) === value) return;
      if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
    };
    function prepareParent(parent) {
      if (!parents.has(parent)) {
        parents.set(parent,parent.style.position);
        const position=doc.defaultView.getComputedStyle(parent).position;
        if(position==='static' || !position)parent.style.position='relative';
      }
    }
    if(title) {
      remember(title,'data-ss-title-reserved');remember(title,'data-ss-title-inline');
      if(doc.defaultView.getComputedStyle(title).display==='inline')title.setAttribute('data-ss-title-inline','');
      title.setAttribute('data-ss-title-reserved','');
    }
    for (const [kind, target] of [['title',title],['thumbnail',thumbnail]]) {
      if (!target) continue;
      for (const name of ['aria-hidden','inert','data-ss-concealed']) remember(target,name);
      const parent = target.parentElement;
      prepareParent(parent);
      const ui=doc.createElement('div');
      ui.dataset.ssUi=kind;
      ui.className=`ss-redaction ss-${kind}`;
      const label=doc.createElement('span');
      label.className='ss-label';
      label.textContent=kind==='title'?'Spoiler hidden':'Keep the surprise.';
      const button=doc.createElement('button');
      button.type='button'; button.dataset.ssControl=kind;
      ui.append(label,button); parent.append(ui);
      const slot={target,ui,label,button}; slots.set(kind,slot);
      button.addEventListener('click',event=>{
        event.preventDefault(); event.stopImmediatePropagation();
        states[kind]=!states[kind]; update(); onReveal(kind,states[kind]);
      });
      for (const eventName of ['pointerdown','mousedown','keydown']) {
        button.addEventListener(eventName,event=>event.stopPropagation());
      }
    }
    function layout() {
      for (const [kind,{target,ui}] of slots) {
        const parentNode=target.parentElement;
        const rect=target.getBoundingClientRect(), parent=parentNode.getBoundingClientRect();
        const left=rect.left-parent.left-parentNode.clientLeft+parentNode.scrollLeft;
        const parentStyle=doc.defaultView.getComputedStyle(parentNode);
        const rowWidth=parentNode.clientWidth-(parseFloat(parentStyle.paddingRight)||0)-left;
        ui.style.left=`${left}px`;
        ui.style.top=`${rect.top-parent.top-parentNode.clientTop+parentNode.scrollTop}px`;
        ui.style.width=`${kind==='title'?Math.max(rect.width,rowWidth):rect.width}px`;
        ui.style.height=`${Math.max(rect.height,kind==='title'?20:0)}px`;
      }
    }
    remember(card,'data-ss-thumbnail-hidden');
    function update() {
      if(!states.thumbnail) card.setAttribute('data-ss-thumbnail-hidden','');
      else card.removeAttribute('data-ss-thumbnail-hidden');
      for (const [kind,{target,ui,label,button}] of slots) {
        const revealed=states[kind];
        ui.dataset.revealed=String(revealed);
        label.hidden=revealed;
        button.textContent=`${revealed?'Hide':'Reveal'} ${kind}`;
        button.setAttribute('aria-pressed',String(revealed));
        if (revealed) {
          for (const name of ['aria-hidden','inert','data-ss-concealed']) restore(target,name,saved.get(target).get(name));
        } else {
          target.setAttribute('aria-hidden','true'); target.setAttribute('inert',''); target.setAttribute('data-ss-concealed','');
        }
      }
      scrub(); layout();
    }
    function capturePageAttributes() {
      for (const [node,attributes] of saved) for (const name of ['title','aria-label','alt']) {
        // While concealed our own value is absent; a new value belongs to the page.
        if (attributes.has(name) && node.hasAttribute(name)) attributes.set(name,node.getAttribute(name));
      }
    }
    function scrub() {
      capturePageAttributes();
      // Never copy concealed words into extension-generated labels. Preserve page attributes for restoration.
      const text=title?.textContent.trim().toLocaleLowerCase();
      if (!text) return;
      const nodes=[card,...card.querySelectorAll('[title],[aria-label],[alt]')];
      for (const node of nodes) {
        if (node.closest('[data-ss-ui]')) continue;
        for (const name of ['title','aria-label','alt']) {
          const value=node.getAttribute(name);
          if (value && value.toLocaleLowerCase().includes(text)) remember(node,name);
        }
      }
      for (const [node,attributes] of saved) for (const [name,value] of attributes) {
        if (!['title','aria-label','alt'].includes(name)) continue;
        if (!states.title) node.removeAttribute(name); else restore(node,name,value);
      }
    }
    const Resize = doc.defaultView.ResizeObserver;
    const observer = Resize ? new Resize(layout) : null;
    for (const {target} of slots.values()) observer?.observe(target);
    doc.defaultView.addEventListener('resize',layout);
    update();
    return {
      refresh() {
        if(destroyed)return;
        for(const {target,ui} of slots.values()) {
          const parent=target.parentElement;
          if(parent && ui.parentElement!==parent) {prepareParent(parent);parent.append(ui);}
        }
        scrub();layout();
      },
      destroy() {
        if(destroyed) return; destroyed=true;
        observer?.disconnect(); doc.defaultView.removeEventListener('resize',layout);
        capturePageAttributes();
        for(const {ui} of slots.values()) ui.remove();
        for(const [node,attributes] of saved) for(const [name,value] of attributes) restore(node,name,value);
        for(const [parent,position] of parents) parent.style.position=position;
        saved.clear(); slots.clear(); parents.clear();
      }
    };
  };
})();
