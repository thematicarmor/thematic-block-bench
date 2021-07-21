const elements = [];
const Outliner = {
	root: [],
	elements: elements,
	selected: selected,
	buttons: {
		visibility: {
			id: 'visibility',
			title: tl('switches.visibility'),
			icon: ' fa fa-eye',
			icon_off: ' fa fa-eye-slash',
			advanced_option: false
		},
		locked: {
			id: 'locked',
			title: tl('switches.lock'),
			icon: ' fas fa-lock',
			icon_off: ' fas fa-lock-open',
			advanced_option: true
		},
		export: {
			id: 'export',
			title: tl('switches.export'),
			icon: ' fa fa-camera',
			icon_off: ' far fa-window-close',
			advanced_option: true
		},
		shade: {
			id: 'shade',
			get title() {return Project.box_uv ? tl('switches.mirror') : tl('switches.shade')},
			get icon() {return Project.box_uv ? 'fa fa-star' : 'fa fa-star'},
			get icon_off() {return Project.box_uv ? 'fas fa-star-half-alt' : 'far fa-star'},
			advanced_option: true
		},
		autouv: {
			id: 'autouv',
			title: tl('switches.autouv'),
			icon: ' fa fa-thumbtack',
			icon_off: ' far fa-times-circle',
			icon_alt: ' fa fa-magic',
			advanced_option: true,
			getState(element) {
				if (!element.autouv) {
					return false
				} else if (element.autouv === 1) {
					return true
				} else {
					return 'alt'
				}
			}
		}
	}
}
//Colors
var markerColors = [
	{pastel: "#A2EBFF", standard: "#58C0FF", name: 'light_blue'},
	{pastel: "#FFF899", standard: "#F3D81A", name: 'yellow'},
	{pastel: "#E8BD7B", standard: "#EC9218", name: 'orange'},
	{pastel: "#FFA7A4", standard: "#FA565D", name: 'red'},
	{pastel: "#C5A6E8", standard: "#B55AF8", name: 'purple'},
	{pastel: "#A6C8FF", standard: "#4D89FF", name: 'blue'},
	{pastel: "#7BFFA3", standard: "#00CE71", name: 'green'},
	{pastel: "#BDFFA6", standard: "#AFFF62", name: 'lime'}
]
class OutlinerNode {
	constructor(uuid) {
		this.uuid = uuid || guid()
		this.export = true;
		this.locked = false;
	}
	init() {
		OutlinerNode.uuids[this.uuid] = this;
		this.constructor.all.safePush(this);
		if (!this.parent || (this.parent === 'root' && Outliner.root.indexOf(this) === -1)) {
			this.addTo('root')
		}
		return this;
	}
	//Sorting
	sortInBefore(element, index_mod) {
		var index = -1;
		index_mod = index_mod || 0;

		if (element.parent === 'root') {
			index = Outliner.root.indexOf(element)
			var arr = Outliner.root
			this.parent = 'root'
		} else {
			index = element.parent.children.indexOf(element)
			element = element.parent
			var arr = element.children
			this.parent = element
		}
		this.removeFromParent()

		//Adding
		if (index < 0)
			arr.push(this)
		else {
			arr.splice(index+index_mod, 0, this)
		}
		return this;
	}
	addTo(group, index = -1) {
		//Resolve Group Argument
		if (!group) {
			group = 'root'
		} else if (group !== 'root') {
			if (group.type !== 'group') {
				if (group.parent === 'root') {
					index = Outliner.root.indexOf(group)+1
					group = 'root'
				} else {
					index = group.parent.children.indexOf(group)+1
					group = group.parent
				}
			}
		}
		this.removeFromParent()

		//Get Array
		if (group === 'root') {
			var arr = Outliner.root
			this.parent = 'root'
		} else {
			var arr = group.children
			this.parent = group
		}

		//Adding
		if (arr.includes(this)) return this;
		if (index < 0)
			arr.push(this)
		else {
			arr.splice(index, 0, this)
		}

		return this;
	}
	removeFromParent() {
		this.getParentArray().remove(this);
		return this;
	}
	getParentArray() {
		if (this.parent === 'root') {
			return Outliner.root
		} else if (typeof this.parent === 'object') {
			return this.parent.children
		}
	}
	//Outliner
	showInOutliner() {
		var scope = this;
		if (this.parent !== 'root') {
			this.parent.openUp()
		}
		Vue.nextTick(() => {
			var el = $('#'+scope.uuid)
			if (el.length === 0) return;
			var outliner_pos = $('#outliner').offset().top

			var el_pos = el.offset().top
			if (el_pos > outliner_pos && el_pos < $('#cubes_list').height() + outliner_pos) return;

			var multiple = el_pos > outliner_pos ? 0.8 : 0.2
			var scroll_amount = el.offset().top  + $('#cubes_list').scrollTop() - outliner_pos - 20
			scroll_amount -= $('#cubes_list').height()*multiple - 15

			$('#cubes_list').animate({
				scrollTop: scroll_amount
			}, 200);
		})
	}
	updateElement() {
		var scope = this;
		var old_name = this.name;
		scope.name = '_&/3%6-7A';
		scope.name = old_name;
		return this;
	}
	getDepth() {
		var d = 0;
		function it(p) {
			if (p.parent) {
				d++;
				return it(p.parent)
			} else {
				return d-1;
			}
		}
		return it(this)
	}
	remove() {
		this.constructor.all.remove(this);
		if (OutlinerNode.uuids[this.uuid] == this) delete OutlinerNode.uuids[this.uuid];
		this.removeFromParent()
	}
	rename() {
		this.showInOutliner()
		var obj = $('#'+this.uuid+' > div.outliner_object > input.cube_name')
		obj.attr('disabled', false)
		obj.select()
		obj.focus()
		obj.addClass('renaming')
		Blockbench.addFlag('renaming')
		this.old_name = this.name
		return this;
	}
	saveName(save) {
		var scope = this;
		if (save !== false && scope.name.trim().length > 0 && scope.name != scope.old_name) {
			var name = scope.name.trim();
			scope.name = scope.old_name;
			if (scope.type === 'group') {
				Undo.initEdit({outliner: true})
			} else {
				Undo.initEdit({elements: [scope]})
			}
			scope.name = name
			scope.sanitizeName();
			delete scope.old_name
			if (Condition(scope.needsUniqueName)) {
				scope.createUniqueName()
			}
			Undo.finishEdit('Rename element')
		} else {
			scope.name = scope.old_name
			delete scope.old_name
		}
		return this;
	}
	sanitizeName() {
		var name_regex = typeof this.name_regex == 'function' ? this.name_regex(this) : this.name_regex;
		if (name_regex) {
			var regex = new RegExp(`[^${name_regex}]`, 'g');
			this.name = this.name.replace(regex, c => {
				if (c == '-' && '_'.search(regex) == -1) {
					return '_';
				}
				if (c.toLowerCase().search(regex) == -1) {
					return c.toLowerCase();
				}
				return '';
			});
		}
	}
	createUniqueName(arr) {
		if (!Condition(this.needsUniqueName)) return;
		var scope = this;
		var others = this.constructor.all.slice();
		if (arr && arr.length) {
			arr.forEach(g => {
				others.safePush(g)
			})
		}
		let zero_based = this.name.match(/[^\d]0$/) !== null;
		var name = this.name.replace(/\d+$/, '').replace(/\s+/g, '_');
		function check(n) {
			for (var i = 0; i < others.length; i++) {
				if (others[i] !== scope && others[i].name.toLowerCase() == n.toLowerCase()) return false;
			}
			return true;
		}
		if (check(this.name)) {
			return this.name;
		}
		for (var num = zero_based ? 1 : 2; num < 8e3; num++) {
			if (check(name+num)) {
				scope.name = name+num;
				return scope.name;
			}
		}
		return false;
	}
	isIconEnabled(toggle) {
		if (typeof toggle.getState == 'function') {
			return toggle.getState(this);
		} else if (this[toggle.id] !== undefined) {
			return this[toggle.id];
		} else {
			return true;
		}
	}
	isChildOf(group, max_levels) {
		function iterate(obj, level) {
			if (!obj || obj === 'root') {
				return false;
			} else if (obj === group) {
				return true;
			} else if (!max_levels || level < max_levels-1) {
				return iterate(obj.parent, level+1)
			}
			return false;
		}
		return iterate(this.parent, 0)
	}
	get mirror_uv() {
		return !this.shade;
	}
	set mirror_uv(val) {
		this.shade = !val;
	}
}
OutlinerNode.uuids = {};
class OutlinerElement extends OutlinerNode {
	constructor(data, uuid) {
		super(uuid);
		this.parent = 'root';
		this.selected = false;
	}
	init() {
		super.init();
		elements.safePush(this);
	}
	remove() {
		super.remove()
		selected.remove(this);
		elements.remove(this);
		this.constructor.selected.remove(this);
		return this;
	}
	showContextMenu(event) {
		Prop.active_panel = 'outliner'
		if (this.locked) return this;
		if (!this.selected) {
			this.select()
		}
		this.menu.open(event, this)
		return this;
	}
	forSelected(fc, undo_tag) {
		if (this.constructor.selected.length <= 1 || !this.constructor.selected.includes(this)) {
			var edited = [this]
		} else {
			var edited = this.constructor.selected
		}
		if (typeof fc === 'function') {
			if (undo_tag) {
				Undo.initEdit({elements: edited})
			}
			for (var i = 0; i < edited.length; i++) {
				fc(edited[i])
			}
			if (undo_tag) {
				Undo.finishEdit(undo_tag)
			}
		}
		return edited;
	}
	duplicate() {
		var copy = new this.constructor(this);
		//Numberation
		var number = copy.name.match(/[0-9]+$/)
		if (number) {
			number = parseInt(number[0])
			copy.name = copy.name.split(number).join(number+1)
		}
		//Rest
		let last_selected = this.getParentArray().filter(el => el.selected || el == this).last();
		copy.sortInBefore(last_selected, 1).init();
		var index = selected.indexOf(this)
		if (index >= 0) {
			selected[index] = copy
		} else {
			selected.push(copy)
		}
		if (Condition(copy.needsUniqueName)) {
			copy.createUniqueName()
		}
		TickUpdates.selection = true;
		return copy;
	}
	select(event, isOutlinerClick) {
		if (Modes.animate && this.constructor != NullObject) return false;
		//Shiftv
		var just_selected = []
		if (event && event.shiftKey === true && this.getParentArray().includes(selected[selected.length-1]) && !Modes.paint && isOutlinerClick) {
			var starting_point;
			var last_selected = selected[selected.length-1]
			this.getParentArray().forEach((s, i) => {
				if (s === last_selected || s === this) {
					if (starting_point) {
						starting_point = false
					} else {
						starting_point = true
					}
					if (s.type !== 'group') {
						if (!selected.includes(s)) {
							s.selectLow()
							just_selected.push(s)
						}
					} else {
						s.selectLow()
					}
				} else if (starting_point) {
					if (s.type !== 'group') {
						if (!selected.includes(s)) {
							s.selectLow()
							just_selected.push(s)
						}
					} else {
						s.selectLow()
					}
				}
			})

		//Control
		} else if (event && !Modes.paint && (event.ctrlOrCmd || event.shiftKey )) {
			if (selected.includes(this)) {
				selected.replace(selected.filter((e) => {
					return e !== this
				}))
			} else {
				this.selectLow()
				just_selected.push(this)
			}

		//Normal
		} else {
			selected.forEachReverse(obj => obj.unselect())
			if (Group.selected) Group.selected.unselect()
			this.selectLow()
			just_selected.push(this)
			this.showInOutliner()
		}
		if (Group.selected) {
			Group.selected.unselect()
		}
		Group.all.forEach(function(s) {
			s.selected = false;
		})
		Blockbench.dispatchEvent('added_to_selection', {added: just_selected})
		updateSelection()
		return this;
	}
	selectLow() {
		selected.safePush(this);
		this.constructor.selected.safePush(this)
		this.selected = true;
		TickUpdates.selection = true;
		return this;
	}
	unselect() {
		selected.remove(this);
		this.selected = false;
		this.constructor.selected.remove(this);
		TickUpdates.selection = true;
		return this;
	}
}
	OutlinerElement.prototype.isParent = false;
	OutlinerElement.fromSave = function(obj, keep_uuid) {
		let Type = OutlinerElement.types[obj.type] || Cube;
		if (Type) {
			return new Type(obj, keep_uuid ? obj.uuid : 0).init()
		}
	}
	OutlinerElement.selected = selected;
	OutlinerElement.all = elements;
	OutlinerElement.types = {};

class NodePreviewController {
	constructor(type, data = {}) {
		Object.assign(this, data);
		this.type = type;
		type.preview_controller = this;
	}
	setup(element) {
		var mesh = new THREE.Object3D();
		Canvas.meshes[obj.uuid] = mesh;
		mesh.name = obj.uuid;
		mesh.type = 'cube';
		mesh.isElement = true;

		Canvas.adaptObjectFaces(obj, mesh)
		Canvas.adaptObjectPosition(obj, mesh)
		
		//scene.add(mesh)
		if (Prop.view_mode === 'textured') {
			Canvas.updateUV(obj);
		}
		mesh.visible = obj.visibility;
		Canvas.buildOutline(obj);
	}
	remove(element) {
		let {mesh} = this;
		if (mesh.parent) mesh.parent.remove(mesh);
		if (mesh.geometry) mesh.geometry.dispose();
		if (mesh.outline && mesh.outline.geometry) mesh.outline.geometry.dispose();
	}
	updateHierarchy(element) {
		
	}
	updateTransform(element) {
		
	}
	updateGeometry(element) {
		
	}
	updateUV(element) {
		
	}
	updateFaces(element) {
		
	}
	updateVisibility(element) {
		element.mesh.visible = !!element.visibility;
	}
	updatePaintingGrid(element) {
		
	}
	updateHierarchy(element) {
		
	}
	updateHierarchy(element) {
		
	}
}

Cube.preview_controller.setup();

new NodePreviewController(Cube, {

})

Array.prototype.findRecursive = function(key1, val) {
	var i = 0
	while (i < this.length) {
		if (this[i][key1] === val) {
			return this[i];
		} else if (this[i].children && this[i].children.length > 0) {
			let inner = this[i].children.findRecursive(key1, val)
			if (inner !== undefined) {
				return inner;
			}
		}
		i++;
	}
	return undefined;
}

function compileGroups(undo, lut) {
	var result = []
	function iterate(array, save_array) {
		var i = 0;
		for (var element of array) {
			if (element.type === 'group') {

				if (lut === undefined || element.export === true) {

					var obj = element.compile(undo)

					if (element.children.length > 0) {
						iterate(element.children, obj.children)
					}
					save_array.push(obj)
				}
			} else {
				if (undo) {
					save_array.push(element.uuid)
				} else {
					if (lut) {
						var index = lut[elements.indexOf(element)]
					} else {
						var index = elements.indexOf(element)
					}
					if (index >= 0) {
						save_array.push(index)
					}
				}
			}
			i++;
		}
	}
	iterate(Outliner.root, result)
	return result;
}
function parseGroups(array, import_reference, startIndex) {
	function iterate(array, save_array, addGroup) {
		var i = 0;
		while (i < array.length) {
			if (typeof array[i] === 'number' || typeof array[i] === 'string') {

				if (typeof array[i] === 'number') {
					var obj = elements[array[i] + (startIndex ? startIndex : 0) ]
				} else {
					var obj = OutlinerNode.uuids[array[i]];
				}
				if (obj) {
					obj.removeFromParent()
					save_array.push(obj)
					obj.parent = addGroup
				}
			} else {
				if (OutlinerNode.uuids[array[i].uuid] instanceof Group) {
					OutlinerNode.uuids[array[i].uuid].removeFromParent();
					delete OutlinerNode.uuids[array[i].uuid];
				}
				var obj = new Group(array[i], array[i].uuid)
				obj.parent = addGroup
				obj.isOpen = !!array[i].isOpen
				if (array[i].uuid) {
					obj.uuid = array[i].uuid
				}
				save_array.push(obj)
				obj.init()
				if (array[i].children && array[i].children.length > 0) {
					iterate(array[i].children, obj.children, obj)
				}
				if (array[i].content && array[i].content.length > 0) {
					iterate(array[i].content, obj.children, obj)
				}
			}
			i++;
		}
	}
	if (import_reference instanceof Group && startIndex !== undefined) {
		iterate(array, import_reference.children, import_reference)
	} else {
		if (!import_reference) {
			Group.all.forEach(group => {
				group.removeFromParent();
			})
			Group.all.empty();
		}
		iterate(array, Outliner.root, 'root');
	}
}

// Dropping
function dropOutlinerObjects(item, target, event, order) {
	if (item.type === 'group' && target && target.parent) {
		var is_parent = false;
		function iterate(g) {
			if (!(is_parent = g === item) && g.parent.type === 'group') {
				iterate(g.parent)
			}
		}
		iterate(target)
		if (is_parent) return;
	}
	if (item instanceof OutlinerElement && selected.includes( item )) {
		var items = selected.slice();
	} else {
		var items = [item];
	}
	if (event.altKey) {
		Undo.initEdit({elements: [], outliner: true, selection: true})
		selected.empty();
	} else {
		Undo.initEdit({outliner: true, selection: true})
		var updatePosRecursive = function(item) {
			if (item.type === 'cube') {
				Canvas.adaptObjectPosition(item)
			} else if (item.type === 'group' && item.children && item.children.length) {
				item.children.forEach(updatePosRecursive)
			}
		}
	}
	if (order) {
		var parent = target.parent
		if (!parent || parent === 'root') {
			parent = {children: Outliner.root};
		}
	}
	function place(obj) {
		if (!order) {
			obj.addTo(target)
		} else {
			obj.removeFromParent()
			var position = parent.children.indexOf(target)
			if (order === 1) position++;
			parent.children.splice(position, 0, obj)
			obj.parent = parent.type ? parent : 'root';
		}
	}
	items.forEach(function(item) {
		if (item && item !== target) {
			if (event.altKey) {
				if (item instanceof Group) {
					var dupl = item.duplicate()
					place(dupl)
					dupl.select()
				} else {
					var cube = item.duplicate()
					place(cube)
					selected.safePush(cube)
				}
			} else {
				place(item)
				if (Format.bone_rig) {
					updatePosRecursive(item)
				}
			}
		}
	})
	if (Format.bone_rig) {
		Canvas.updateAllBones()
	}
	if (event.altKey) {
		updateSelection()
		Undo.finishEdit('Duplicate selection', {elements: selected, outliner: true, selection: true})
	} else {
		Undo.finishEdit('Drag elements in outliner')
	}
}

//Misc
function renameOutliner(element) {
	stopRenameOutliner()

	if (Group.selected && !element && !EditSession.active) {
		Group.selected.rename()

	} else if (selected.length === 1 && !EditSession.active) {
		selected[0].rename()

	} else {

		if (Group.selected && !element) {
			Blockbench.textPrompt('generic.rename', Group.selected.name, function (name) {
				name = name.trim();
				if (name) {
					Undo.initEdit({group: Group.selected})
					Group.selected.name = name
					if (Format.bone_rig) {
						Group.selected.createUniqueName()
					}
					Undo.finishEdit('Rename group')
				}
			})
		} else if (selected.length) {
			Blockbench.textPrompt('generic.rename', selected[0].name, function (name) {
				name = name.trim();
				if (name) {
					Undo.initEdit({elements: selected})
					selected.forEach(function(obj, i) {
						obj.name = name.replace(/%/g, obj.index).replace(/\$/g, i)
					})
					Undo.finishEdit('Rename')
				}
			})
		}
	}
}
function stopRenameOutliner(save) {
	if (Blockbench.hasFlag('renaming')) {
		var uuid = $('.outliner_object input.renaming').parent().parent().attr('id')
		var element = Outliner.root.findRecursive('uuid', uuid)
		if (element) {
			element.saveName(save)
		}
		$('.outliner_object input.renaming').attr('disabled', true).removeClass('renaming')
		$('body').focus()
		if (window.getSelection) {
			window.getSelection().removeAllRanges()
		} else if (document.selection) {
			document.selection.empty()
		}
		Blockbench.removeFlag('renaming')
	}
}
function toggleCubeProperty(key) {
	let affected = selected.filter(element => element[key] != undefined);
	if (!affected.length) return;
	var state = affected[0][key];
	if (typeof state === 'number') {
		state = (state+1) % 3;
	} else {
		state = !state
	}
	Undo.initEdit({elements: affected})
	affected.forEach(element => {
		if (element[key] != undefined) {
			element[key] = state;
		}
	})
	if (key === 'visibility') {
		Canvas.updateVisibility()
	}
	if (key === 'shade' && Project.box_uv) {
		Canvas.updateUVs();
	}
	Undo.finishEdit('Toggle ' + key)
}


BARS.defineActions(function() {
	new Toggle('outliner_toggle', {
		icon: 'dns',
		category: 'edit',
		keybind: new Keybind({key: 115}),
		onChange: function (value) {
			Outliner.vue._data.options.show_advanced_toggles = value;
		}
	})
	new BarText('cube_counter', {
		right: true,
		click: function() {

			var face_count = 0;
			if (Project.box_uv) {
				face_count = Cube.all.length*6;
			} else {
				Cube.all.forEach(cube => {
					for (var face in cube.faces) {
						if (cube.faces[face].texture !== null) face_count++;
					}
				})
			}
			var dialog = new Dialog({
				id: 'model_stats',
				title: 'dialog.model_stats.title',
				width: 300,
				singleButton: true,
				form: {
					cubes: {type: 'info', label: tl('dialog.model_stats.cubes'), text: ''+Cube.all.length },
					locators: {type: 'info', label: tl('dialog.model_stats.locators'), text: ''+Locator.all.length, condition: Format.locators },
					groups: {type: 'info', label: tl('dialog.model_stats.groups'), text: ''+Group.all.length },
					vertices: {type: 'info', label: tl('dialog.model_stats.vertices'), text: ''+Cube.all.length*8 },
					faces: {type: 'info', label: tl('dialog.model_stats.faces'), text: ''+face_count },
				}
			})
			dialog.show()

		},
		onUpdate: function() {
			if (Animator.open) {
				var sel = 0;
				if (Group.selected) {
					Group.selected.forEachChild(_ => sel++, Group, true)
				}
				this.set(sel+'/'+Group.all.length)
			} else {
				this.set(selected.length+'/'+elements.length)
			}
		}
	})

	new Action('sort_outliner', {
		icon: 'sort_by_alpha',
		category: 'edit',
		click: function () {
			Undo.initEdit({outliner: true});
			if (Outliner.root.length < 1) return;
			Outliner.root.sort(function(a,b) {
				return sort_collator.compare(a.name, b.name)
			});
			Undo.finishEdit('Sort outliner')
		}
	})
	new Action('unlock_everything', {
		icon: 'fas.fa-key',
		category: 'edit',
		click: function () {
			let locked = Outliner.elements.filter(el => el.locked);
			let locked_groups = Group.all.filter(group => group.locked)
			if (locked.length + locked_groups.length == 0) return;

			Undo.initEdit({outliner: locked_groups.length > 0, elements: locked});
			[...locked, ...locked_groups].forEach(el => {
				el.locked = false;
			})
			Undo.finishEdit('Unlock everything')
		}
	})
	new Toggle('element_colors', {
		category: 'edit',
		icon: 'palette',
		linked_setting: 'outliner_colors'
	})
	new Action('select_window', {
		icon: 'filter_list',
		category: 'edit',
		keybind: new Keybind({key: 'f', ctrl: true}),
		condition: () => Modes.edit || Modes.paivnt,
		click: function () {
			let color_options = {
				'-1': 'generic.all'
			}
			markerColors.forEach((color, i) => {
				color_options[i] = 'cube.color.' + color.name;
			})
			let dialog = new Dialog({
				id: 'selection_creator',
				title: 'dialog.select.title',
				form_first: true,
				form: {
					new: {label: 'dialog.select.new', type: 'checkbox', value: true},
					group: {label: 'dialog.select.group', type: 'checkbox'},
					name: {label: 'dialog.select.name', type: 'text'},
					texture: {label: 'data.texture', type: 'text', list: Texture.all.map(tex => tex.name)},
					color: {label: 'menu.cube.color', type: 'select', value: '-1', options: color_options}
				},
				lines: [
					`<div class="dialog_bar form_bar">
						<label class="name_space_left">${tl('dialog.select.random')}</label>
						<input type="range" min="0" max="100" step="1" value="100" class="tool half" style="width: 100%;" id="selgen_random">
					</div>`
				],
				onConfirm(formData) {
					if (formData.new) {
						selected.empty();
					}
					let selected_group = Group.selected;
					if (Group.selected) {
						Group.selected.unselect()
					}
					var name_seg = formData.name.toUpperCase()
					var tex_seg = formData.texture.toLowerCase()
					var rdm = $('#selgen_random').val()/100
				
					var array = Outliner.elements;
					if ($('#selgen_group').is(':checked') && selected_group) {
						array = selected_group.children
					}
				
					array.forEach(function(obj) {
						if (obj.name.toUpperCase().includes(name_seg) === false) return;
						if (obj instanceof Cube && tex_seg && !Format.single_texture) {
							var has_tex = false;
							for (var key in obj.faces) {
								var tex = obj.faces[key].getTexture();
								if (tex && tex.name.includes(tex_seg)) {
									has_tex = true
								}
							}
							if (!has_tex) return;
						}
						if (formData.color != '-1') {
							if (obj instanceof Cube == false || obj.color.toString() != formData.color) return;
						}
						if (Math.random() > rdm) return;
						selected.safePush(obj)
					})
					updateSelection()
					if (selected.length) {
						selected[0].showInOutliner()
					}
					this.hide()
				}
			}).show()
			$('.dialog#selection_creator .form_bar_name > input').focus()
		}
	})
	new Action('invert_selection', {
		icon: 'swap_vert',
		category: 'edit',
		keybind: new Keybind({key: 'i', ctrl: true}),
		condition: () => Modes.edit || Modes.paint,
		click: function () {
			elements.forEach(function(s) {
				if (s.selected) {
					s.unselect()
				} else {
					s.selectLow()
				}
			})
			if (Group.selected) Group.selected.unselect()
			updateSelection()
			Blockbench.dispatchEvent('invert_selection')
		}
	})
	new Action('select_all', {
		icon: 'select_all',
		category: 'edit',
		condition: () => !Modes.display,
		keybind: new Keybind({key: 'a', ctrl: true}),
		click: function () {selectAll()}
	})
})

Interface.definePanels(function() {

	var VueTreeItem = Vue.extend({
		template: 
		'<li class="outliner_node" v-bind:class="{ parent_li: node.children && node.children.length > 0}" v-bind:id="node.uuid">' +
			`<div
				class="outliner_object"
				v-bind:class="{ cube: node.type === 'cube', group: node.type === 'group', selected: node.selected }"
				v-bind:style="{'padding-left': indentation + 'px'}"
				@contextmenu.prevent.stop="node.showContextMenu($event)"
				@click="node.select($event, true)"
				@touchstart="node.select($event)" :title="node.title"
				@dblclick.stop.self="renameOutliner()"
			>` +
				//Opener
				
				'<i v-if="node.children && node.children.length > 0 && (!options.hidden_types.length || node.children.some(node => !options.hidden_types.includes(node.type)))" v-on:click.stop="node.isOpen = !node.isOpen" class="icon-open-state fa" :class=\'{"fa-angle-right": !node.isOpen, "fa-angle-down": node.isOpen}\'></i>' +
				'<i v-else class="outliner_opener_placeholder"></i>' +
				//Main
				'<i :class="node.icon + ((settings.outliner_colors.value && node.color >= 0) ? \' ec_\'+node.color : \'\')" v-on:dblclick.stop="if (node.children && node.children.length) {node.isOpen = !node.isOpen;}"></i>' +
				'<input type="text" class="cube_name tab_target" v-model="node.name" disabled>' +


				`<i v-for="btn in node.buttons"
					v-if="(!btn.advanced_option || options.show_advanced_toggles || (btn.id === \'locked\' && node.isIconEnabled(btn)))"
					class="outliner_toggle"
					:class="getBtnClasses(btn, node)"
					:title="btn.title"
					:toggle="btn.id"
					@click.stop
				></i>` +
			'</div>' +
			//Other Entries
			'<ul v-if="node.isOpen">' +
				'<vue-tree-item v-for="item in visible_children" :node="item" :options="options" v-key="item.uuid"></vue-tree-item>' +
				`<div class="outliner_line_guide" v-if="node == Group.selected" v-bind:style="{left: indentation + 'px'}"></div>` +
			'</ul>' +
		'</li>',
		props: {
			options: Object,
			node: {
				type: Object
			}
		},
		computed: {
			indentation() {
				return this.node.getDepth ? (limitNumber(this.node.getDepth(), 0, (this.width-100) / 16) * 16) : 0;
			},
			visible_children() {
				if (!this.options.hidden_types.length) {
					return this.node.children;
				} else {
					return this.node.children.filter(node => !this.options.hidden_types.includes(node.type));
				}
			}
		},
		methods: {
			nodeClass: function (node) {
				if (node.isOpen) {
					return node.openedIcon || node.icon;
				} else {
					return node.closedIcon || node.icon;
				}
			},
			getBtnClasses: function (btn, node) {
				let value = node.isIconEnabled(btn);
				if (value === true) {
					return [btn.icon];
				} else if (value === false) {
					return [btn.icon_off, 'icon_off'];
				} else {
					return [btn.icon_alt];
				}
			}
		}
	});
	Vue.component('vue-tree-item', VueTreeItem);

	function eventTargetToNode(target) {
		let target_node = target;
		let i = 0;
		while (target_node && target_node.classList && !target_node.classList.contains('outliner_node')) {
			if (i < 4 && target_node) {
				target_node = target_node.parentNode;
				i++;
			} else {
				return [];
			}
		}
		return [OutlinerNode.uuids[target_node.id], target_node];
	}
	function getOrder(loc, obj) {
		if (!obj) {
			return;
		} else if (obj instanceof Group) {
			if (loc < 8) return -1;
			if (loc > 24) return 1;
		} else {
			if (loc < 16) return -1;
			return 1;
		}
		return 0;
	}

	Interface.Panels.outliner = new Panel({
		id: 'outliner',
		icon: 'list_alt',
		condition: {modes: ['edit', 'paint', 'animate']},
		toolbars: {
			head: Toolbars.outliner
		},
		growable: true,
		onResize() {
			if (this.inside_vue) this.inside_vue.width = this.width;
		},
		component: {
			name: 'panel-outliner',
			data() { return {
				root: Outliner.root,
				options: {
					width: 300,
					show_advanced_toggles: false,
					hidden_types: []
				}
			}},
			methods: {
				openMenu(event) {
					Interface.Panels.outliner.menu.show(event)
				},
				dragToggle(e1) {
					let [original] = eventTargetToNode(e1.target);
					let affected = [];
					let affected_groups = [];
					let key = e1.target.getAttribute('toggle');
					let previous_values = {};
					let value = original[key];
					value = (typeof value == 'number') ? (value+1) % 3 : !value;

					function move(e2) {
						convertTouchEvent(e2);
						if (e2.target.classList.contains('outliner_toggle') && e2.target.getAttribute('toggle') == key) {
							let [node] = eventTargetToNode(e2.target);
							if (key == 'visibility' && e2.altKey && !affected.length) {
								let new_affected = Outliner.elements.filter(node => !node.selected);
								value = !(new_affected[0] && new_affected[0][key]);
								new_affected.forEach(node => {
									affected.push(node);
									previous_values[node.uuid] = node[key];
									node[key] = value;
								})
								// Update
								Canvas.updateVisibility();
								
							} else if (!affected.includes(node) && (!node.locked || key == 'locked' || key == 'visibility')) {
								let new_affected = [node];
								if (node instanceof Group) {
									node.forEachChild(node => new_affected.push(node))
									affected_groups.push(node);
								} else if (node.selected && selected.length > 1) {
									selected.forEach(el => {
										if (node[key] != undefined) new_affected.safePush(el);
									})
								}
								new_affected.forEach(node => {
									affected.push(node);
									previous_values[node.uuid] = node[key];
									node[key] = value;
									if (key == 'shade' && node instanceof Cube) Canvas.updateUV(node);
								})
								// Update
								if (key == 'visibility') Canvas.updateVisibility();
								if (key == 'locked') updateSelection();
							}
						}
					}
					function off(e2) {
						if (affected.length) {
							affected.forEach(node => {
								node[key] = previous_values[node.uuid];
							})
							Undo.initEdit({elements: affected.filter(node => node instanceof OutlinerElement), outliner: affected_groups.length > 0})
							affected.forEach(node => {
								node[key] = value;
								if (key == 'shade') node.updateElement();
							})
							Undo.finishEdit(`toggle ${key} property`)
						}
						removeEventListeners(document, 'mousemove touchmove', move);
						removeEventListeners(document, 'mouseup touchend', off);
					}
					addEventListeners(document, 'mousemove touchmove', move, {passive: false});
					addEventListeners(document, 'mouseup touchend', off, {passive: false});

					move(e1);

					e1.preventDefault()

				},
				dragNode(e1) {
					if (getFocusedTextInput()) return;
					convertTouchEvent(e1);

					if (e1.target.classList.contains('outliner_toggle')) {
						this.dragToggle(e1);
						return false;
					}
					
					let [item] = eventTargetToNode(e1.target);
					if (!item || item.locked) {
						function off(e2) {
							removeEventListeners(document, 'mouseup touchend', off);
							if (e2.target && e2.target.id == 'cubes_list') unselectAll();
						}
						addEventListeners(document, 'mouseup touchend', off);
						return;
					};

					let active = false;
					let helper;
					let timeout;
					let drop_target, drop_target_node, order;
					let last_event = e1;

					function move(e2) {
						convertTouchEvent(e2);
						let offset = [
							e2.clientX - e1.clientX,
							e2.clientY - e1.clientY,
						]
						if (!active) {
							let distance = Math.sqrt(Math.pow(offset[0], 2) + Math.pow(offset[1], 2))
							if (Blockbench.isTouch) {
								if (distance > 20 && timeout) {
									clearTimeout(timeout);
									timeout = null;
								} else {
									document.getElementById('cubes_list').scrollTop += last_event.clientY - e2.clientY;
								}
							} else if (distance > 6) {
								active = true;
							}
						} else {
							if (e2) e2.preventDefault();
							
							if (open_menu) open_menu.hide();

							if (!helper) {
								helper = document.createElement('div');
								helper.id = 'outliner_drag_helper';
								let icon = document.createElement('i');		icon.className = item.icon;	helper.append(icon);
								let span = document.createElement('span');	span.innerText = item.name;	helper.append(span);
								
								if (item instanceof Group == false && Outliner.selected.length > 1) {
									let counter = document.createElement('div');
									counter.classList.add('outliner_drag_number');
									counter.textContent = Outliner.selected.length.toString();
									helper.append(counter);
								}
								document.body.append(helper);
							}
							helper.style.left = `${e2.clientX}px`;
							helper.style.top = `${e2.clientY}px`;

							// drag
							$('.drag_hover').removeClass('drag_hover');
							$('.outliner_node[order]').attr('order', null);

							let target = document.elementFromPoint(e2.clientX, e2.clientY);
							[drop_target, drop_target_node] = eventTargetToNode(target);
							if (drop_target) {
								var location = e2.clientY - $(drop_target_node).offset().top;
								order = getOrder(location, drop_target)
								drop_target_node.setAttribute('order', order)
								drop_target_node.classList.add('drag_hover');

							} else if ($('#cubes_list').is(':hover')) {
								$('#cubes_list').addClass('drag_hover');
							}
						}
						last_event = e2;
					}
					function off(e2) {
						if (helper) helper.remove();
						removeEventListeners(document, 'mousemove touchmove', move);
						removeEventListeners(document, 'mouseup touchend', off);
						$('.drag_hover').removeClass('drag_hover');
						$('.outliner_node[order]').attr('order', null);
						if (Blockbench.isTouch) clearTimeout(timeout);

						if (active && !open_menu) {
							convertTouchEvent(e2);
							let target = document.elementFromPoint(e2.clientX, e2.clientY);
							[drop_target] = eventTargetToNode(target);
							if (drop_target) {
								dropOutlinerObjects(item, drop_target, e2, order);
							} else if ($('#cubes_list').is(':hover')) {
								dropOutlinerObjects(item, undefined, e2);
							}
						}
					}

					if (Blockbench.isTouch) {
						timeout = setTimeout(() => {
							active = true;
							move(e1);
						}, 320)
					}

					addEventListeners(document, 'mousemove touchmove', move, {passive: false});
					addEventListeners(document, 'mouseup touchend', off, {passive: false});
				}
			},
			template: `
				<div>
					<div class="toolbar_wrapper outliner"></div>
					<ul id="cubes_list"
						class="list mobile_scrollbar"
						@contextmenu.stop.prevent="openMenu($event)"
						@mousedown="dragNode($event)"
						@touchstart="dragNode($event)"
					>
						<vue-tree-item v-for="item in root" :node="item" :options="options" v-key="item.uuid"></vue-tree-item>
					</ul>
				</div>
			`
		},
		menu: new Menu([
			'add_cube',
			'add_group',
			'_',
			'sort_outliner',
			'select_all',
			'collapse_groups',
			'unfold_groups',
			'element_colors',
			'outliner_toggle'
		])
	})
	Outliner.vue = Interface.Panels.outliner.inside_vue;
})
