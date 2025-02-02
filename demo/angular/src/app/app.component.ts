import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GridStack, GridStackOptions, GridStackWidget } from 'gridstack';
import { GridstackComponent, NgGridStackWidget, elementCB, nodesCB } from './gridstack.component';

// unique ids sets for each item for correct ngFor updating
let ids = 1;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild(GridstackComponent) gridComp?: GridstackComponent;
  @ViewChild('origTextArea', {static: true}) origTextEl?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('textArea', {static: true}) textEl?: ElementRef<HTMLTextAreaElement>;

  // which sample to show
  public show = 6; // nested

  /** sample grid options and items to load... */
  public items: GridStackWidget[] = [
    {x: 0, y: 0, minW: 2},
    {x: 1, y: 1},
    {x: 2, y: 2},
  ];
  public gridOptions: GridStackOptions = {
    margin: 5,
    float: true,
    minRow: 1,
  }
  public gridOptionsFull: GridStackOptions = {
    ...this.gridOptions,
    children: this.items,
  }

  // nested grid options
  private subOptions: GridStackOptions = {
    cellHeight: 50, // should be 50 - top/bottom
    column: 'auto', // size to match container. make sure to include gridstack-extra.min.css
    acceptWidgets: true, // will accept .grid-stack-item by default
    margin: 5,
  };
  private sub1: NgGridStackWidget[] = [ {x:0, y:0, type:'app-a'}, {x:1, y:0, type:'app-b'}, {x:2, y:0, type:'app-c'}, {x:3, y:0}, {x:0, y:1}, {x:1, y:1}];
  private sub2: NgGridStackWidget[] = [ {x:0, y:0}, {x:0, y:1, w:2}];
  private subChildren: NgGridStackWidget[] = [
    {x:0, y:0, content: 'regular item'},
    {x:1, y:0, w:4, h:4, subGrid: {children: this.sub1, id:'sub1_grid', class: 'sub1', ...this.subOptions}},
    {x:5, y:0, w:3, h:4, subGrid: {children: this.sub2, id:'sub2_grid', class: 'sub2', ...this.subOptions}},
  ]
  public nestedGridOptions: GridStackOptions = { // main grid options
    cellHeight: 50,
    margin: 5,
    minRow: 2, // don't collapse when empty
    disableOneColumnMode: true,
    acceptWidgets: true,
    id: 'main',
    children: this.subChildren
  };
  private serializedData?: GridStackOptions;

  constructor() {
    // give them content and unique id to make sure we track them during changes below...
    [...this.items, ...this.subChildren, ...this.sub1, ...this.sub2].forEach((w: NgGridStackWidget) => {
      if (!w.type && !w.subGrid) w.content = `item ${ids}`;
      w.id = String(ids++);
    });
  }

  ngOnInit(): void {
    this.onShow(this.show);

    // TEST
    // setTimeout(() => {
    //   if (!this.gridComp) return;
    //   this.saveGrid();
    //   this.clearGrid();
    //   // this.loadGrid();
    // }, 500)
  }

  public onShow(val: number) {
    this.show = val;
    const data = val === 6 ? this.nestedGridOptions : this.gridOptionsFull;
    if (this.origTextEl) this.origTextEl.nativeElement.value = JSON.stringify(data, null, '  ');

    // if (val === 6 && !this.gridComp) {
    //   const cont: HTMLElement | null = document.querySelector('.grid-container');
    //   if (cont) GridStack.addGrid(cont, this.serializedData);
    // }
  }

  /** called whenever items change size/position/etc.. */
  public onChange(data: nodesCB) {
    // TODO: update our TEMPLATE list to match ?
    // NOTE: no need for dynamic as we can always use grid.save() to get latest layout, or grid.engine.nodes
    console.log('change ', data.nodes.length > 1 ? data.nodes : data.nodes[0]);
  }

  public onResizeStop(data: elementCB) {
    console.log('resizestop ', data.el.gridstackNode);
  }

  /**
   * TEST dynamic grid operations - uses grid API directly (since we don't track structure that gets out of sync)
   */
  public add() {
    // TODO: BUG the content doesn't appear until widget is moved around (or another created). Need to force
    // angular detection changes...
    this.gridComp?.grid?.addWidget({x:3, y:0, w:2, content:`item ${ids}`, id:String(ids++)});
  }
  public delete() {
    let grid = this.gridComp?.grid;
    if (!grid) return;
    let node = grid.engine.nodes[0];
    if (node?.subGrid) {
      grid = node.subGrid as GridStack;
      node = grid?.engine.nodes[0];
    }
    if (node) grid.removeWidget(node.el!);
  }
  public modify() {
    this.gridComp?.grid?.update(this.gridComp?.grid.engine.nodes[0]?.el!, {w:3})
  }
  public newLayout() {
    this.gridComp?.grid?.load([
      {x:0, y:1, id:'1', minW:1, w:1}, // new size/constrain
      {x:1, y:1, id:'2'},
      // {x:2, y:1, id:'3'}, // delete item
      {x:3, y:0, w:2, content:'new item'}, // new item
    ]);
  }

  /**
   * ngFor case: TEST TEMPLATE operations - NOT recommended unless you have no GS creating/re-parenting
   */
  public addNgFor() {
    // new array isn't required as Angular detects changes to content with trackBy:identify()
    // this.items = [...this.items, { x:3, y:0, w:3, content:`item ${ids}`, id:String(ids++) }];
    this.items.push({x:3, y:0, w:2, content:`item ${ids}`, id:String(ids++)});
  }
  public deleteNgFor() {
    this.items.pop();
  }
  public modifyNgFor() {
    // this will not update the DOM nor trigger gridstackItems.changes for GS to auto-update, so set new option of the gridItem instead
    // this.items[0].w = 3;
    const gridItem = this.gridComp?.gridstackItems?.get(0);
    if (gridItem) gridItem.options = {w:3};
  }
  public newLayoutNgFor() {
    this.items = [
      {x:0, y:1, id:'1', minW:1, w:1}, // new size/constrain
      {x:1, y:1, id:'2'},
      // {x:2, y:1, id:'3'}, // delete item
      {x:3, y:0, w:2, content:'new item'}, // new item
    ];
  }
  public clearGrid() {
    if (!this.gridComp) return;
    this.gridComp.grid?.removeAll(true);
  }
  public saveGrid() {
    this.serializedData = this.gridComp?.grid?.save(false, true) as GridStackOptions || ''; // no content, full options
    if (this.textEl) this.textEl.nativeElement.value = JSON.stringify(this.serializedData, null, '  ');
  }
  public loadGrid() {
    if (!this.gridComp) return;
    GridStack.addGrid(this.gridComp.el, this.serializedData);
  }

  // ngFor TEMPLATE unique node id to have correct match between our items used and GS
  public identify(index: number, w: GridStackWidget) {
    return w.id; // or use index if no id is set and you only modify at the end...
  }
}
