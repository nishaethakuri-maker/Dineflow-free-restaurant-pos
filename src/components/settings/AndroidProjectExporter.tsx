import React, { useState } from 'react';
import {
  Code2,
  Download,
  Copy,
  Check,
  FolderTree,
  FileCode,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';

export const AndroidProjectExporter: React.FC = () => {
  const { showToast } = usePOS();
  const [activeFile, setActiveFile] = useState<string>('MainActivity.kt');
  const [copied, setCopied] = useState<boolean>(false);

  const kotlinFiles: Record<string, { path: string; language: string; content: string }> = {
    'MainActivity.kt': {
      path: 'app/src/main/java/com/dineflow/pos/MainActivity.kt',
      language: 'kotlin',
      content: `package com.dineflow.pos

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.dineflow.pos.ui.DineFlowApp
import com.dineflow.pos.ui.theme.DineFlowTheme
import com.dineflow.pos.viewmodel.PosViewModel
import com.dineflow.pos.viewmodel.PosViewModelFactory

class MainActivity : ComponentActivity() {
    private val posViewModel: PosViewModel by viewModels {
        PosViewModelFactory((application as DineFlowApplication).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DineFlowTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    DineFlowApp(viewModel = posViewModel)
                }
            }
        }
    }
}`,
    },
    'Entities.kt': {
      path: 'app/src/main/java/com/dineflow/pos/data/local/Entities.kt',
      language: 'kotlin',
      content: `package com.dineflow.pos.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import java.util.UUID

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val role: String, // owner, manager, cashier, waiter, kitchen
    val pin: String,  // 4-digit PIN
    val isActive: Boolean = true
)

@Entity(tableName = "menu_items")
data class MenuItemEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val nameNepali: String? = null,
    val code: String,
    val categoryId: String,
    val price: Long,      // Stored in NPR integer units (Paisa or direct Rs)
    val costPrice: Long,
    val foodType: String, // veg, non-veg
    val isAvailable: Boolean = true,
    val imageUri: String? = null,
    val description: String? = null
)

@Entity(tableName = "restaurant_tables")
data class RestaurantTableEntity(
    @PrimaryKey val id: String,
    val tableNumber: String,
    val section: String,
    val capacity: Int,
    val status: String, // available, occupied, reserved
    val currentOrderId: String? = null
)

@Entity(tableName = "orders")
data class OrderEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val orderNumber: String,
    val orderType: String, // dine-in, takeaway, delivery
    val tableId: String? = null,
    val tableName: String? = null,
    val customerName: String? = null,
    val subtotal: Long,
    val discountAmount: Long,
    val serviceChargeAmount: Long,
    val taxAmount: Long,
    val grandTotal: Long,
    val status: String,    // active, preparing, ready, completed, cancelled
    val createdAt: Long = System.currentTimeMillis(),
    val waiterId: String,
    val waiterName: String
)

@Entity(tableName = "inventory_items")
data class InventoryItemEntity(
    @PrimaryKey val id: String,
    val name: String,
    val category: String,
    val currentStock: Double,
    val unit: String,
    val minThreshold: Double,
    val costPerUnit: Double
)`,
    },
    'PosDao.kt': {
      path: 'app/src/main/java/com/dineflow/pos/data/local/PosDao.kt',
      language: 'kotlin',
      content: `package com.dineflow.pos.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface PosDao {
    @Query("SELECT * FROM menu_items WHERE isAvailable = 1")
    fun getAvailableMenuItems(): Flow<List<MenuItemEntity>>

    @Query("SELECT * FROM restaurant_tables")
    fun getAllTables(): Flow<List<RestaurantTableEntity>>

    @Query("SELECT * FROM orders WHERE status != 'completed' AND status != 'cancelled'")
    fun getActiveOrders(): Flow<List<OrderEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: OrderEntity)

    @Update
    suspend fun updateTable(table: RestaurantTableEntity)

    @Transaction
    suspend fun completeOrderAndFreeTable(order: OrderEntity, tableId: String?) {
        insertOrder(order.copy(status = "completed"))
        if (tableId != null) {
            // Free the table
            updateTableStatus(tableId, "available", null)
        }
    }

    @Query("UPDATE restaurant_tables SET status = :status, currentOrderId = :orderId WHERE id = :tableId")
    suspend fun updateTableStatus(tableId: String, status: String, orderId: String?)
}`,
    },
    'PosDatabase.kt': {
      path: 'app/src/main/java/com/dineflow/pos/data/local/PosDatabase.kt',
      language: 'kotlin',
      content: `package com.dineflow.pos.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        UserEntity::class,
        MenuItemEntity::class,
        RestaurantTableEntity::class,
        OrderEntity::class,
        InventoryItemEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class PosDatabase : RoomDatabase() {
    abstract fun posDao(): PosDao

    companion object {
        @Volatile
        private var INSTANCE: PosDatabase? = null

        fun getDatabase(context: Context): PosDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    PosDatabase::class.java,
                    "dineflow_pos.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}`,
    },
    'build.gradle.kts': {
      path: 'app/build.gradle.kts',
      language: 'kotlin',
      content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.dineflow.pos"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.dineflow.pos"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    
    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    
    // Kotlin Coroutines
    implementation(libs.kotlinx.coroutines.android)
    
    // Thermal ESC/POS Bluetooth Printer SDK
    implementation("com.github.DantSu:ESCPOS-ThermalPrinter-Android:3.3.0")
}`,
    },
    'AndroidManifest.xml': {
      path: 'app/src/main/AndroidManifest.xml',
      language: 'xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Bluetooth Thermal Printer Permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:name=".DineFlowApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.DineFlow">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.DineFlow"
            android:screenOrientation="sensorLandscape">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
    },
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(kotlinFiles[activeFile].content);
    setCopied(true);
    showToast(`Copied ${activeFile} to clipboard`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate bundle markdown/file
    let bundle = `# DineFlow POS - Native Android Studio Kotlin Project Files\n\n`;
    for (const [name, file] of Object.entries(kotlinFiles)) {
      bundle += `### File: ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`;
    }

    const blob = new Blob([bundle], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DineFlow_POS_Android_Native_Project.md';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Android Studio Project Files Bundle!', 'success');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Native Android Project Source Code (Kotlin & Jetpack Compose)
            </h3>
            <p className="text-xs text-slate-400">
              Clean Room DB entity classes, DAO queries, Android Manifest, and Gradle configs
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-950/40"
        >
          <Download className="w-4 h-4" />
          <span>Export Android Project Bundle</span>
        </button>
      </div>

      {/* File Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800 pt-2">
        {Object.keys(kotlinFiles).map((fileName) => (
          <button
            key={fileName}
            onClick={() => setActiveFile(fileName)}
            className={`px-3 py-1.5 rounded-t-xl text-xs font-mono font-medium flex items-center gap-1.5 transition ${
              activeFile === fileName
                ? 'bg-slate-950 text-emerald-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>{fileName}</span>
          </button>
        ))}
      </div>

      {/* Code Viewer */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 flex justify-between items-center text-[11px] font-mono text-slate-400">
          <span>{kotlinFiles[activeFile].path}</span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-72">
          <code>{kotlinFiles[activeFile].content}</code>
        </pre>
      </div>
    </div>
  );
};
