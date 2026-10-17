package com.example.streamme

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.InsetDrawable
import android.content.res.ColorStateList
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactFragment
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class MainActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler, PermissionAwareActivity {
  private lateinit var content: FrameLayout
  private lateinit var homeTab: TextView
  private lateinit var streamTab: TextView
  private var pageFragment: ReactFragment? = null
  private var activePage: String? = null
  private var permissionListener: PermissionListener? = null

  private val background = Color.rgb(247, 248, 252)
  private val accent = Color.rgb(37, 89, 244)
  private val muted = Color.rgb(119, 129, 149)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    window.statusBarColor = background
    window.navigationBarColor = Color.WHITE
    window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(this@MainActivity.background)
    }
    ViewCompat.setOnApplyWindowInsetsListener(root) { view, windowInsets ->
      val navigationBarBottom = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom
      view.setPadding(view.paddingLeft, view.paddingTop, view.paddingRight, navigationBarBottom)
      windowInsets
    }
    content = FrameLayout(this).apply { id = View.generateViewId() }
    root.addView(content, LinearLayout.LayoutParams(-1, 0, 1f))

    val tabs = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      setBackgroundColor(Color.WHITE)
      elevation = dp(8).toFloat()
    }
    homeTab = tab("Beranda", R.drawable.tab_home)
    streamTab = tab("Live Stream", R.drawable.tab_live_stream)
    tabs.addView(homeTab, LinearLayout.LayoutParams(0, dp(62), 1f))
    tabs.addView(streamTab, LinearLayout.LayoutParams(0, dp(62), 1f))
    root.addView(tabs)
    setContentView(root)

    homeTab.setOnClickListener { showHome() }
    streamTab.setOnClickListener { showStream() }
    showHome()
  }

  private fun tab(label: String, icon: Int) = TextView(this).apply {
    text = label
    textSize = 12f
    typeface = android.graphics.Typeface.DEFAULT_BOLD
    gravity = Gravity.CENTER
    compoundDrawablePadding = dp(3)
    setCompoundDrawablesWithIntrinsicBounds(null, ContextCompat.getDrawable(this@MainActivity, icon), null, null)
    isClickable = true
    isFocusable = true
    contentDescription = label
  }

  private fun showHome() {
    showPage("home")
  }

  private fun showStream() {
    showPage("live")
  }

  private fun showPage(page: String) {
    if (activePage == page && pageFragment != null) return
    pageFragment?.let { supportFragmentManager.beginTransaction().remove(it).commitNow() }
    content.removeAllViews()
    val launchOptions = Bundle().apply { putString("initialPage", page) }
    val fragment = ReactFragment.Builder()
      .setComponentName("StreamMe")
      .setLaunchOptions(launchOptions)
      .build()
    supportFragmentManager.beginTransaction().add(content.id, fragment).commitNow()
    pageFragment = fragment
    activePage = page
    selectTab(page == "live")
  }

  private fun selectTab(stream: Boolean) {
    styleTab(homeTab, !stream)
    styleTab(streamTab, stream)
  }

  private fun styleTab(tab: TextView, selected: Boolean) {
    val color = if (selected) accent else muted
    tab.setTextColor(color)
    tab.compoundDrawableTintList = ColorStateList.valueOf(color)
    val pill = GradientDrawable().apply {
      shape = GradientDrawable.RECTANGLE
      cornerRadius = dp(28).toFloat()
      setColor(if (selected) Color.rgb(241, 242, 246) else Color.TRANSPARENT)
    }
    tab.background = InsetDrawable(pill, dp(46), dp(4), dp(46), dp(4))
  }

  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

  override fun invokeDefaultOnBackPressed() {
    onBackPressedDispatcher.onBackPressed()
  }

  override fun checkPermission(permission: String, pid: Int, uid: Int): Int =
    super.checkPermission(permission, pid, uid)

  override fun checkSelfPermission(permission: String): Int =
    super.checkSelfPermission(permission)

  override fun shouldShowRequestPermissionRationale(permission: String): Boolean =
    super.shouldShowRequestPermissionRationale(permission)

  @Suppress("DEPRECATION")
  override fun requestPermissions(permissions: Array<String>, requestCode: Int, listener: PermissionListener?) {
    permissionListener = listener
    super.requestPermissions(permissions, requestCode)
  }

  @Deprecated("Deprecated in Android API")
  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    if (permissionListener?.onRequestPermissionsResult(requestCode, permissions as Array<String>, grantResults) == true) {
      permissionListener = null
    }
  }
}
