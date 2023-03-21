import { App, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';

interface Settings {
	interval: string;
	enabled: boolean;
	viewTypes: string[];
}

const DEFAULT_SETTINGS: Settings = {
	interval: '5',
	enabled: true,
	viewTypes: ['markdown', 'canvas'],
}

export default class MyPlugin extends Plugin {
	settings: Settings;
	private timerId: number;
	private enabled: boolean = false;
	private direction: boolean = true;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('rotate-cw', 'Tab Rotation', (evt: MouseEvent) => {
			this.enabled = !this.enabled
			if (this.enabled) {
				this.direction = true;
				this.startTabRotation();
				new Notice('Tap right rotation enabled!');
			} else {
				this.stopTabRotation();
				new Notice('Tap rotation disabled!');
			}
		});

		this.addSettingTab(new SettingTab(this.app, this));

		this.addCommand({
			id: 'rotate-right',
			name: 'Start rotating to the right',
			callback: () => {
				if(this.enabled && !this.direction) {
					this.direction = false;
					this.stopTabRotation();
					this.startTabRotation();
					new Notice('Tap right rotation enabled!');
				}
				else if(!this.enabled) {
					this.direction = true;
					this.startTabRotation();
					this.enabled = !this.enabled
					new Notice('Tap right rotation enabled!');
				}
			},
		});

		this.addCommand({
			id: 'rotate-left',
			name: 'Start rotating to the left',
			callback: () => {
				if(this.enabled && !this.direction) {
					this.direction = true;
					this.stopTabRotation();
					this.startTabRotation();
					new Notice('Tap left rotation enabled!');
				}
				else if(!this.enabled) {
					this.direction = false;
					this.startTabRotation()
					this.enabled = !this.enabled
					new Notice('Tap left rotation enabled!');
				}
			},
		});	  

		this.addCommand({
			id: 'stop-rotation',
			name: 'Stop tab rotation',
			callback: () => {
				if(this.enabled) {
					this.stopTabRotation();
					this.enabled = !this.enabled
					new Notice('Tap rotation disabled!');
				}
			},
		});
	}

	startTabRotation() {
		if (!isNumeric(this.settings.interval)) {
			this.settings.interval = "5"
			new Notice('The specified internval is not number. The default is set to 5 sec');
		}
		else if (parseFloat(this.settings.interval) < 0.1) {
			this.settings.interval = "5"
			new Notice('The specified internval is less than 0.1 sec which is too fast. The default is set to 5 sec');
		}

    	this.timerId = window.setInterval(() => {
			(this.direction)? this.rotateRightTabs(): this.rotateLeftTabs()
    	}, parseFloat(this.settings.interval) * 1000);
	}

	stopTabRotation() {
		window.clearInterval(this.timerId);
	}

	getLeavesOfTypes(types: string[]): WorkspaceLeaf[] {
		const leaves: WorkspaceLeaf[] = [];

		this.app.workspace.iterateAllLeaves((leaf) => {
			const isMainWindow = leaf.view.containerEl.win == window;
			const correctViewType = types.contains(leaf.view.getViewType());
			const sameWindow = leaf.view.containerEl.win == activeWindow;

			//Ignore sidebar panes in the main window, because non-main window don't have a sidebar
			const correctPane = isMainWindow ? (sameWindow && leaf.getRoot() == this.app.workspace.rootSplit) : sameWindow;
			if (
				correctViewType
				&& correctPane
			) {
				leaves.push(leaf);
			}
		});

		return leaves;
	}

	async rotateRightTabs() {
		const active = this.app.workspace.getLeaf();
		const leaves: WorkspaceLeaf[] = this.getLeavesOfTypes(this.settings.viewTypes);
		
		if (active) {
			const index = leaves.indexOf(active);
			if (index === leaves.length - 1) {
				this.app.workspace.setActiveLeaf(leaves[0], {focus: true});
			} else {
				this.app.workspace.setActiveLeaf(leaves[index + 1], {focus: true});
			}
		}
	}

	async rotateLeftTabs() {
		const active = this.app.workspace.getLeaf();
		const leaves: WorkspaceLeaf[] = this.getLeavesOfTypes(this.settings.viewTypes);
		
		if (active) {
			const index = leaves.indexOf(active);
			if (index === 0) {
				this.app.workspace.setActiveLeaf(leaves[leaves.length - 1], {focus: true});
			} else {
				this.app.workspace.setActiveLeaf(leaves[index - 1], {focus: true});
			}
		}
	}

	async onunload() {
		window.clearInterval(this.timerId);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		
		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for Tab Rotation PlugIn'});

		new Setting(containerEl)
			.setName('Interval')
			.setDesc('Set Interval (secs)')
			.addText(text => text
			.setPlaceholder('Enter interval (secs)')
			.setValue(this.plugin.settings.interval)
			.onChange(async (value) => {
				this.plugin.settings.interval = value;
				await this.plugin.saveSettings();
			}));
	}
}

function isNumeric(str: string) {
	if (typeof str != "string") {
	  return false;
	}
	return !isNaN(Number(str)) && !isNaN(parseFloat(str));
}