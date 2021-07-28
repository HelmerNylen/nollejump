Level.levels.set("SG1112", (infoOnly) => {
	const level = new Level(
		{
			"code": "SG1112",
			"name": "Mekanik I",
			"hp": 9
		},
		// Hur många inlämningar?
		1, // Homework-tokens
		1, // KS-tokens
		1  // Tenta-tokens
	);
	if (infoOnly)
		return level;

	// ...

	return level;
});
Level.levels.set("SG1115", (infoOnly) => {
	const level = new Level(
		{
			"code": "SG1115",
			"name": "Partikeldynamik med projekt",
			"hp": 7.5
		},
		// Hur många inlämningar?
		2, // Homework-tokens
		0, // KS-tokens
		2  // Tenta-tokens
	);
	if (infoOnly)
		return level;

	// ...

	return level;
});