var TaskModule = Module.extend({
	prototype: {

		actions: {
			click: [
				"remove",
				"toggleSelection"
			],
			submit: [
				"add"
			]
		},

		callbacks: {
			"afterAddTask": [
				"onAfterAddTask"
			],
			"afterReady": [
				"onReady"
			],
			"beforeAddTask": [
				"onBeforeAddTask"
			]
		},

		options: {
			actionPrefix: "tasks"
		},

		onReady: function onReady() {
			console.info("Ready!");
		},

		onAfterAddTask: function onAfterAddTask(item, task) {
			console.info("Task added!");
			console.log({task: task, item: item});
		},

		onBeforeAddTask: function onBeforeAddTask(item, task) {
			console.info("Before task added!");
			console.log({task: task, item: item});
		},

		add: function add(event, element, params) {
			event.stop();
			var form = element.form || element;
			var task = form.elements.task.value;

			if (/^\s*$/.test(task)) {
				alert("Please enter a task");
				form.elements.task.focus();
				return;
			}

			var item = document.createElement("li");
			item.setAttribute("data-action", this.options.actionPrefix + ".toggleSelection");
			item.innerHTML = task + ' <button type="button" data-action="' + this.options.actionPrefix + '.remove">X</button>';

			if (this.callbacks.execute("beforeAddTask", item, task)) {
				this.element.getElementsByTagName("ol")[0].appendChild(item);
				form.elements.task.value = "";
				form.elements.task.focus();
				this.callbacks.execute("afterAddTask", item, task);
			}
		},

		remove: function remove(event, element, params) {
			if (confirm("Are you sure?")) {
				element.parentNode.parentNode.removeChild(element.parentNode);
			}
		},

		toggleSelection: function toggleSelection(event, element, params) {
			element.className = (element.className === "selected") ? "" : "selected";
		}

	}
});
