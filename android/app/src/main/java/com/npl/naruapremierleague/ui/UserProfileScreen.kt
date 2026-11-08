package com.npl.naruapremierleague.ui

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.EmojiEvents
import androidx.compose.material.icons.outlined.SportsCricket
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Custom User Profile Screen with Animated Circular Progress Indicators.
 * Built with Material Design 3, state hoisting, and modular layout components.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserProfileScreen(
    userName: String = "Rahul Sharma",
    userRole: String = "All-Rounder • Royal Strikers",
    userAvatarInitials: String = "RS",
    onEditProfileClick: () -> Unit = {},
    onShareProfileClick: () -> Unit = {}
) {
    // State management for active tab selection
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    var isFollowing by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Player Profile",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                actions = {
                    IconButton(onClick = onShareProfileClick) {
                        Icon(Icons.Default.Share, contentDescription = "Share Profile")
                    }
                    IconButton(onClick = { /* Notification action */ }) {
                        Icon(Icons.Default.Notifications, contentDescription = "Notifications")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Header Section with Avatar, Info, and Primary Action
            UserProfileHeader(
                name = userName,
                role = userRole,
                avatarInitials = userAvatarInitials,
                isFollowing = isFollowing,
                onFollowToggle = { isFollowing = !isFollowing },
                onEditClick = onEditProfileClick
            )

            // 2. Circular Performance Progress Metrics Card
            PerformanceMetricsCard()

            // 3. Tab Filter Chips
            ProfileTabSelector(
                selectedIndex = selectedTabIndex,
                onTabSelected = { selectedTabIndex = it }
            )

            // 4. Tab Content Section
            when (selectedTabIndex) {
                0 -> OverviewTabContent()
                1 -> MatchesTabContent()
                2 -> AchievementsTabContent()
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    )
}

/**
 * 1. User Header Component
 * Customization: Adjust colors, avatar size, or gradient background here.
 */
@Composable
fun UserProfileHeader(
    name: String,
    role: String,
    avatarInitials: String,
    isFollowing: Boolean,
    onFollowToggle: () -> Unit,
    onEditClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Avatar Container with Gradient Border
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.primary,
                                MaterialTheme.colorScheme.tertiary
                            )
                        )
                    )
                    .padding(3.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surface),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = avatarInitials,
                    style = MaterialTheme.typography.headlineLarge.copy(
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = name,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 22.sp
                )
            )

            Text(
                text = role,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Follow & Edit Buttons Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = onFollowToggle,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isFollowing) MaterialTheme.colorScheme.secondary
                        else MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text(text = if (isFollowing) "Following" else "Follow Player")
                }

                OutlinedButton(
                    onClick = onEditClick,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.size(height = 40.dp, width = 48.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "Edit Profile",
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

/**
 * 2. Custom Animated Circular Progress Bar Component
 * Customization: Adjust size, strokeWidth, progressColor, or trackColor.
 */
@Composable
fun CustomCircularProgressBar(
    progress: Float, // 0.0f to 1.0f
    modifier: Modifier = Modifier,
    size: Dp = 100.dp,
    strokeWidth: Dp = 10.dp,
    progressColor: Color = MaterialTheme.colorScheme.primary,
    trackColor: Color = MaterialTheme.colorScheme.outlineVariant,
    centerContent: @Composable () -> Unit = {}
) {
    var animatedProgressTarget by remember { mutableFloatStateOf(0f) }

    // Smooth entry animation for the progress bar arc
    val animatedProgress by animateFloatAsState(
        targetValue = animatedProgressTarget,
        animationSpec = tween(durationMillis = 1200, easing = FastOutSlowInEasing),
        label = "CircularProgressAnimation"
    )

    LaunchedEffect(progress) {
        animatedProgressTarget = progress
    }

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val strokeWidthPx = strokeWidth.toPx()

            // Draw Background Track Circle
            drawCircle(
                color = trackColor,
                style = Stroke(width = strokeWidthPx, cap = StrokeCap.Round)
            )

            // Draw Animated Progress Arc
            drawArc(
                color = progressColor,
                startAngle = -90f,
                sweepAngle = 360f * animatedProgress,
                useCenter = false,
                style = Stroke(width = strokeWidthPx, cap = StrokeCap.Round)
            )
        }

        // Center Text / Icon Content
        centerContent()
    }
}

/**
 * Performance Metrics Card displaying custom circular progress indicators.
 */
@Composable
fun PerformanceMetricsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "Season Overview",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(bottom = 16.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Circular Metric 1: Win Rate
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CustomCircularProgressBar(
                        progress = 0.78f, // 78% win rate
                        progressColor = Color(0xFF4CAF50),
                        size = 80.dp,
                        strokeWidth = 8.dp
                    ) {
                        Text(
                            text = "78%",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Win Rate",
                        style = MaterialTheme.typography.labelMedium.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }

                // Circular Metric 2: Strike Rate Target
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CustomCircularProgressBar(
                        progress = 0.85f, // 85% Strike Rate Performance Index
                        progressColor = MaterialTheme.colorScheme.primary,
                        size = 80.dp,
                        strokeWidth = 8.dp
                    ) {
                        Text(
                            text = "154.2",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Strike Rate",
                        style = MaterialTheme.typography.labelMedium.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }

                // Circular Metric 3: Catch Efficiency
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CustomCircularProgressBar(
                        progress = 0.92f, // 92% fielding efficiency
                        progressColor = Color(0xFFFF9800),
                        size = 80.dp,
                        strokeWidth = 8.dp
                    ) {
                        Text(
                            text = "92%",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Fielding %",
                        style = MaterialTheme.typography.labelMedium.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
            }
        }
    }
}

/**
 * 3. Filter Chip Tab Bar
 */
@Composable
fun ProfileTabSelector(
    selectedIndex: Int,
    onTabSelected: (Int) -> Unit
) {
    val tabs = listOf("Overview", "Matches", "Awards")

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        tabs.forEachIndexed { index, label ->
            FilterChip(
                selected = selectedIndex == index,
                onClick = { onTabSelected(index) },
                label = {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
                    )
                },
                modifier = Modifier.weight(1f),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    }
}

/**
 * 4a. Overview Tab Content
 */
@Composable
fun OverviewTabContent() {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        StatItemRow(
            icon = Icons.Outlined.SportsCricket,
            title = "Total Matches",
            value = "34 Matches"
        )
        StatItemRow(
            icon = Icons.Default.Star,
            title = "Runs Scored",
            value = "1,248 Runs (Avg 41.6)"
        )
        StatItemRow(
            icon = Icons.Outlined.EmojiEvents,
            title = "Wickets Taken",
            value = "28 Wickets (Econ 6.8)"
        )
    }
}

/**
 * 4b. Matches Tab Content
 */
@Composable
fun MatchesTabContent() {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        MatchSummaryCard(
            matchTitle = "NPL Final: Royal Strikers vs Super Kings",
            matchResult = "54* (28b) & 2/18 — Won by 14 runs",
            isMoM = true
        )
        MatchSummaryCard(
            matchTitle = "Semi-Final: Royal Strikers vs Titans",
            matchResult = "42 (31b) & 1/24 — Won by 4 wkts",
            isMoM = false
        )
    }
}

/**
 * 4c. Achievements Tab Content
 */
@Composable
fun AchievementsTabContent() {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        AchievementItemCard(title = "Orange Cap Winner 2025", subtitle = "Highest run scorer of NPL S2")
        AchievementItemCard(title = "Player of the Tournament", subtitle = "Voted best all-rounder")
    }
}

// Sub-component Helper Cards
@Composable
fun StatItemRow(
    icon: ImageVector,
    title: String,
    value: String
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
                Text(
                    text = value,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.Bold
                    )
                )
            }
        }
    }
}

@Composable
fun MatchSummaryCard(
    matchTitle: String,
    matchResult: String,
    isMoM: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                text = matchTitle,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = matchResult,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            )
            if (isMoM) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Outlined.EmojiEvents,
                        contentDescription = "Man of the Match",
                        tint = Color(0xFFFFB300),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Man of the Match",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Color(0xFFFFB300),
                            fontWeight = FontWeight.Bold
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun AchievementItemCard(title: String, subtitle: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Outlined.CheckCircle,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }
        }
    }
}

// Android Studio Jetpack Compose Preview Annotation
@Preview(showBackground = true, name = "Light Mode")
@Composable
fun UserProfileScreenPreview() {
    MaterialTheme {
        UserProfileScreen()
    }
}
